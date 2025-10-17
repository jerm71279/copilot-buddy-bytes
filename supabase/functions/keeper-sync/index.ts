import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeeperRecord {
  recordUid: string;
  title: string;
  login?: string;
  password?: string;
  url?: string;
  notes?: string;
  custom?: Array<{ label: string; value: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const keeperApiKey = Deno.env.get('KEEPER_API_KEY');

    if (!keeperApiKey) {
      throw new Error('KEEPER_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's customer_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      throw new Error('Customer not found');
    }

    const { integration_id, folder_filter } = await req.json();

    if (!integration_id) {
      throw new Error('integration_id is required');
    }

    // Fetch records from Keeper API
    console.log('Fetching records from Keeper API...');
    const keeperResponse = await fetch('https://keepersecurity.com/api/rest/sm/records', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keeperApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: 'get_records',
        folderFilter: folder_filter || null,
      }),
    });

    if (!keeperResponse.ok) {
      throw new Error(`Keeper API error: ${keeperResponse.statusText}`);
    }

    const keeperData = await keeperResponse.json();
    const records: KeeperRecord[] = keeperData.records || [];

    console.log(`Found ${records.length} records in Keeper`);

    // Sync each record to integration_credentials
    let syncedCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        // Encrypt credential data
        const credentialData = {
          recordUid: record.recordUid,
          title: record.title,
          login: record.login,
          password: record.password,
          url: record.url,
          notes: record.notes,
          custom: record.custom,
          lastSyncedAt: new Date().toISOString(),
        };

        // Upsert to integration_credentials
        const { error: upsertError } = await supabase
          .from('integration_credentials')
          .upsert({
            integration_id,
            customer_id: profile.customer_id,
            credential_type: 'keeper_secret',
            credential_name: record.title,
            encrypted_data: new TextEncoder().encode(JSON.stringify(credentialData)),
            metadata: {
              recordUid: record.recordUid,
              url: record.url,
              hasLogin: !!record.login,
              hasPassword: !!record.password,
            },
            is_active: true,
            last_synced_at: new Date().toISOString(),
          }, {
            onConflict: 'integration_id,customer_id,credential_type,credential_name',
          });

        if (upsertError) {
          console.error(`Error syncing record ${record.title}:`, upsertError);
          errorCount++;
        } else {
          syncedCount++;
        }
      } catch (err) {
        console.error(`Error processing record ${record.title}:`, err);
        errorCount++;
      }
    }

    // Log sync to audit trail
    await supabase.from('audit_logs').insert({
      customer_id: profile.customer_id,
      user_id: user.id,
      system_name: 'keeper',
      action_type: 'credential_sync',
      action_details: {
        integration_id,
        total_records: records.length,
        synced: syncedCount,
        errors: errorCount,
      },
      compliance_tags: ['security', 'credential_management'],
    });

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: records.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in keeper-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
