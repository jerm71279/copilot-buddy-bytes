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

    const requestData = await req.json();

    // Comprehensive input validation
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerId = String(requestData.customer_id || '').slice(0, 36);
    const repositoryType = String(requestData.repository_type || '').slice(0, 50);
    
    if (!customerId || customerId.length !== 36) {
      return new Response(
        JSON.stringify({ error: 'Valid customer_id (UUID) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['sharepoint_site', 'teams_channel', 'onedrive'].includes(repositoryType)) {
      return new Response(
        JSON.stringify({ error: 'repository_type must be sharepoint_site, teams_channel, or onedrive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const providerToken = user.user_metadata?.provider_token;
    if (!providerToken) {
      return new Response(
        JSON.stringify({ error: 'No Microsoft access token found. Please connect your Microsoft 365 account.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { repository_id, full_sync } = requestData;

    console.log('requestData', requestData);
    console.log('customerId', customerId);
    console.log('repositoryType', repositoryType);
    console.log('repository_id', repository_id);
    console.log('full_sync', full_sync);

    return new Response(
      JSON.stringify({ data: { message: 'Sync initiated' } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to sync files' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
