import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SharePointDocument {
  id: string;
  name: string;
  webUrl: string;
  fileType: string;
  size: number;
  lastModified: string;
  createdBy: string;
  modifiedBy: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Microsoft credentials
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const sharepointSiteUrl = Deno.env.get('SHAREPOINT_SITE_URL');

    if (!clientId || !clientSecret || !tenantId || !sharepointSiteUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Microsoft credentials. Please configure MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, and SHAREPOINT_SITE_URL' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Extract site path from SharePoint URL
    const siteUrl = new URL(sharepointSiteUrl);
    const sitePath = siteUrl.pathname;

    // Get site ID
    const siteResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteUrl.hostname}:${sitePath}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!siteResponse.ok) {
      throw new Error('Failed to get site information');
    }

    const siteData = await siteResponse.json();
    const siteId = siteData.id;

    // Get documents from all document libraries
    const drivesResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!drivesResponse.ok) {
      throw new Error('Failed to get document libraries');
    }

    const { value: drives } = await drivesResponse.json();
    const documents: SharePointDocument[] = [];

    // Fetch documents from each drive
    for (const drive of drives) {
      const itemsResponse = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${drive.id}/root/children`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      if (itemsResponse.ok) {
        const { value: items } = await itemsResponse.json();
        
        for (const item of items) {
          if (item.file) {
            documents.push({
              id: item.id,
              name: item.name,
              webUrl: item.webUrl,
              fileType: item.name.split('.').pop() || 'unknown',
              size: item.size,
              lastModified: item.lastModifiedDateTime,
              createdBy: item.createdBy?.user?.displayName || 'Unknown',
              modifiedBy: item.lastModifiedBy?.user?.displayName || 'Unknown',
            });
          }
        }
      }
    }

    // Store documents in database
    const { error: insertError } = await supabase
      .from('sharepoint_documents')
      .upsert(
        documents.map(doc => ({
          document_id: doc.id,
          name: doc.name,
          web_url: doc.webUrl,
          file_type: doc.fileType,
          size: doc.size,
          created_by: doc.createdBy,
          modified_by: doc.modifiedBy,
          last_modified: doc.lastModified,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: 'document_id' }
      );

    if (insertError) {
      throw insertError;
    }

    // Log sync
    await supabase
      .from('sharepoint_sync_log')
      .insert({
        documents_synced: documents.length,
        status: 'success',
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentsSynced: documents.length,
        documents 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SharePoint sync error:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Sync error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
