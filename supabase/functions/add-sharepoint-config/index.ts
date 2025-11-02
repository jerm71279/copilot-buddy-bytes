import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();

    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    const customerId = String(requestData.customer_id || '').slice(0, 100);
    const siteName = String(requestData.site_name || '').slice(0, 200);
    const siteUrl = String(requestData.site_url || '').slice(0, 500);

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!siteName) {
      return new Response(
        JSON.stringify({ error: 'site_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!siteUrl) {
      return new Response(
        JSON.stringify({ error: 'site_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating SharePoint config for customer:', customerId, 'site:', siteName);

    // Insert config
    const { data: config, error } = await supabase
      .from('sharepoint_sync_config')
      .insert({
        customer_id: customerId,
        site_id: requestData.site_id || null,
        site_name: siteName,
        site_url: siteUrl,
        library_name: requestData.library_name ? String(requestData.library_name).slice(0, 200) : null,
        sync_enabled: requestData.sync_enabled !== false,
        sync_frequency_minutes: requestData.sync_frequency_minutes 
          ? Math.max(1, Math.min(10080, Number(requestData.sync_frequency_minutes))) 
          : 60,
        filter_extensions: Array.isArray(requestData.filter_extensions) 
          ? requestData.filter_extensions.slice(0, 20).map((ext: any) => String(ext).slice(0, 10))
          : null,
      })
      .select()
      .maybeSingle();

    if (error || !config) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error ? (error instanceof Error ? error.message : 'Database error occurred') : 'Failed to create config' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('SharePoint config created:', config.id);

    return new Response(
      JSON.stringify(config),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
