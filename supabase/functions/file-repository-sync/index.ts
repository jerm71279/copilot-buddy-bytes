import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  customer_id: string;
  repository_type: 'sharepoint_site' | 'teams_channel' | 'onedrive';
  repository_id?: string;
  full_sync?: boolean;
}

interface SyncResult {
  total: number;
  added: number;
  updated: number;
  deleted: number;
}

// Sanitize external data to prevent path traversal and injection
function sanitizeFileName(name: string): string {
  if (!name || typeof name !== 'string') return 'unnamed';
  // Remove path traversal sequences and limit length
  return String(name).replace(/\.\.\//g, '').replace(/\\/g, '/').slice(0, 255);
}

function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string') return '/';
  // Remove dangerous patterns and limit length
  return String(path).replace(/\.\.\//g, '').replace(/\\/g, '/').slice(0, 1000);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    const rawBody = await req.json();
    if (!rawBody || typeof rawBody !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = rawBody as SyncRequest;

    // Validate customer_id (UUID format)
    const customer_id = String(requestData.customer_id || '').trim();
    if (!customer_id || customer_id.length > 100) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required and must be valid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate repository_type
    const validTypes = ['sharepoint_site', 'teams_channel', 'onedrive'];
    if (!requestData.repository_type || !validTypes.includes(requestData.repository_type)) {
      return new Response(
        JSON.stringify({ error: 'repository_type must be sharepoint_site, teams_channel, or onedrive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate optional repository_id
    if (requestData.repository_id) {
      const repository_id = String(requestData.repository_id).trim();
      if (repository_id.length > 100) {
        return new Response(
          JSON.stringify({ error: 'repository_id must be less than 100 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get Microsoft access token
    const providerToken = user.user_metadata?.provider_token;
    if (!providerToken) {
      return new Response(
        JSON.stringify({ error: 'No Microsoft access token found. Please connect your Microsoft 365 account.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync record
    const { data: syncRecord, error: syncError } = await supabase
      .from('file_sync_history')
      .insert({
        customer_id: requestData.customer_id,
        repository_id: requestData.repository_id,
        sync_type: requestData.full_sync ? 'full' : 'manual',
        sync_status: 'started',
        triggered_by: user.id
      })
      .select()
      .maybeSingle();

    if (syncError || !syncRecord) {
      console.error('Failed to create sync record:', syncError);
      return new Response(
        JSON.stringify({ error: 'Failed to start sync' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sync based on repository type
    let result: SyncResult;
    try {
      switch (requestData.repository_type) {
        case 'sharepoint_site':
          result = await syncSharePointSite(providerToken, requestData, supabase, user.id);
          break;
        case 'teams_channel':
          result = await syncTeamsChannel(providerToken, requestData, supabase, user.id);
          break;
        case 'onedrive':
          result = await syncOneDrive(providerToken, requestData, supabase, user.id);
          break;
        default:
          throw new Error('Invalid repository type');
      }

      // Update sync record with success
      await supabase
        .from('file_sync_history')
        .update({
          sync_status: 'completed',
          files_synced: result.total,
          files_added: result.added,
          files_updated: result.updated,
          files_deleted: result.deleted,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncRecord.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          sync_id: syncRecord.id, 
          result,
          message: `Successfully synced ${result.total} files (${result.added} added, ${result.updated} updated)` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (syncError) {
      console.error('Sync error:', syncError);
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
      
      // Update sync record with failure
      await supabase
        .from('file_sync_history')
        .update({
          sync_status: 'failed',
          errors: [{ message: errorMessage, timestamp: new Date().toISOString() }],
          completed_at: new Date().toISOString()
        })
        .eq('id', syncRecord.id);

      throw syncError;
    }

  } catch (error) {
    console.error('Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync files';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function syncSharePointSite(
  token: string, 
  request: SyncRequest, 
  supabase: any,
  userId: string
): Promise<SyncResult> {
  // Get SharePoint sites
  const sitesResponse = await fetch(
    'https://graph.microsoft.com/v1.0/sites?search=*',
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!sitesResponse.ok) {
    throw new Error(`Failed to fetch SharePoint sites: ${sitesResponse.statusText}`);
  }

  const sites = await sitesResponse.json();
  let total = 0, added = 0, updated = 0;

  for (const site of sites.value) {
    // Create or update repository record
    const { data: repo } = await supabase
      .from('file_repositories')
      .upsert({
        customer_id: request.customer_id,
        repository_type: 'sharepoint_site',
        repository_name: sanitizeFileName(site.displayName || site.name || 'SharePoint Site'),
        sharepoint_site_id: String(site.id || '').slice(0, 255),
        external_url: site.webUrl ? String(site.webUrl).slice(0, 500) : null,
        is_active: true,
        sync_enabled: true,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'sharepoint_site_id'
      })
      .select()
      .maybeSingle();

    if (!repo) continue;

    // Get document libraries (drives)
    const drivesResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site.id}/drives`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!drivesResponse.ok) continue;

    const drives = await drivesResponse.json();

    for (const drive of drives.value) {
      const driveResult = await syncDriveContents(
        token,
        site.id,
        drive.id,
        request.customer_id,
        repo.id,
        supabase,
        userId
      );

      total += driveResult.total;
      added += driveResult.added;
      updated += driveResult.updated;
    }
  }

  return { total, added, updated, deleted: 0 };
}

async function syncDriveContents(
  token: string,
  siteId: string,
  driveId: string,
  customerId: string,
  repositoryId: string,
  supabase: any,
  userId: string,
  folderId: string = 'root',
  parentId: string | null = null
): Promise<SyncResult> {
  const itemsResponse = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${folderId}/children`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!itemsResponse.ok) {
    return { total: 0, added: 0, updated: 0, deleted: 0 };
  }

  const items = await itemsResponse.json();
  let total = 0, added = 0;

  for (const item of items.value) {
    const { data: existingFile } = await supabase
      .from('file_metadata')
      .select('id')
      .eq('sharepoint_item_id', item.id)
      .maybeSingle();

    const fileData = {
      customer_id: customerId,
      repository_id: repositoryId,
      file_name: sanitizeFileName(item.name),
      file_path: sanitizePath((item.parentReference?.path || '') + '/' + item.name),
      file_type: item.folder ? 'folder' : 'file',
      mime_type: item.file?.mimeType ? String(item.file.mimeType).slice(0, 100) : null,
      file_size: typeof item.size === 'number' ? item.size : 0,
      parent_folder_id: parentId,
      sharepoint_item_id: String(item.id || '').slice(0, 255),
      sharepoint_web_url: item.webUrl ? String(item.webUrl).slice(0, 500) : null,
      created_by: userId,
      created_at_source: item.createdDateTime,
      modified_at_source: item.lastModifiedDateTime
    };

    if (existingFile) {
      await supabase
        .from('file_metadata')
        .update(fileData)
        .eq('id', existingFile.id);
    } else {
      await supabase
        .from('file_metadata')
        .insert(fileData);
      added++;
    }

    total++;

    // If folder, recursively sync children
    if (item.folder) {
      const childResult = await syncDriveContents(
        token,
        siteId,
        driveId,
        customerId,
        repositoryId,
        supabase,
        userId,
        item.id,
        item.id
      );
      total += childResult.total;
      added += childResult.added;
    }
  }

  return { total, added, updated: 0, deleted: 0 };
}

async function syncTeamsChannel(
  token: string, 
  request: SyncRequest, 
  supabase: any,
  userId: string
): Promise<SyncResult> {
  const teamsResponse = await fetch(
    'https://graph.microsoft.com/v1.0/me/joinedTeams',
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!teamsResponse.ok) {
    throw new Error(`Failed to fetch Teams: ${teamsResponse.statusText}`);
  }

  const teams = await teamsResponse.json();
  let total = 0, added = 0;

  for (const team of teams.value) {
    // Create repository record for team
    const { data: repo } = await supabase
      .from('file_repositories')
      .upsert({
        customer_id: request.customer_id,
        repository_type: 'teams_channel',
        repository_name: sanitizeFileName(team.displayName || 'Teams Channel'),
        teams_channel_id: String(team.id || '').slice(0, 255),
        external_url: team.webUrl ? String(team.webUrl).slice(0, 500) : null,
        is_active: true,
        sync_enabled: true,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'teams_channel_id'
      })
      .select()
      .maybeSingle();

    if (repo) {
      total++;
      added++;
    }
  }

  return { total, added, updated: 0, deleted: 0 };
}

async function syncOneDrive(
  token: string, 
  request: SyncRequest, 
  supabase: any,
  userId: string
): Promise<SyncResult> {
  // Create OneDrive repository
  const { data: repo } = await supabase
    .from('file_repositories')
    .upsert({
      customer_id: request.customer_id,
      repository_type: 'onedrive',
      repository_name: 'My OneDrive',
      onedrive_user_id: userId,
      is_active: true,
      sync_enabled: true,
      last_synced_at: new Date().toISOString()
    })
    .select()
    .maybeSingle();

  if (!repo) {
    throw new Error('Failed to create OneDrive repository');
  }

  const driveResponse = await fetch(
    'https://graph.microsoft.com/v1.0/me/drive/root/children',
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!driveResponse.ok) {
    throw new Error(`Failed to fetch OneDrive files: ${driveResponse.statusText}`);
  }

  const items = await driveResponse.json();
  let total = 0, added = 0;

  for (const item of items.value) {
    const { data: existingFile } = await supabase
      .from('file_metadata')
      .select('id')
      .eq('onedrive_item_id', item.id)
      .maybeSingle();

    const fileData = {
      customer_id: request.customer_id,
      repository_id: repo.id,
      file_name: sanitizeFileName(item.name),
      file_path: sanitizePath('/' + item.name),
      file_type: item.folder ? 'folder' : 'file',
      mime_type: item.file?.mimeType ? String(item.file.mimeType).slice(0, 100) : null,
      file_size: typeof item.size === 'number' ? item.size : 0,
      onedrive_item_id: String(item.id || '').slice(0, 255),
      created_by: userId,
      created_at_source: item.createdDateTime,
      modified_at_source: item.lastModifiedDateTime
    };

    if (existingFile) {
      await supabase
        .from('file_metadata')
        .update(fileData)
        .eq('id', existingFile.id);
    } else {
      await supabase
        .from('file_metadata')
        .insert(fileData);
      added++;
    }

    total++;
  }

  return { total, added, updated: 0, deleted: 0 };
}
