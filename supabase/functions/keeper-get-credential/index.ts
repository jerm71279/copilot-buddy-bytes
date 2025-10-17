import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const { credential_name, record_uid } = await req.json();

    if (!credential_name && !record_uid) {
      throw new Error('credential_name or record_uid is required');
    }

    // Query integration_credentials
    let query = supabase
      .from('integration_credentials')
      .select('*')
      .eq('customer_id', profile.customer_id)
      .eq('credential_type', 'keeper_secret');

    if (credential_name) {
      query = query.eq('credential_name', credential_name);
    } else if (record_uid) {
      query = query.contains('metadata', { recordUid: record_uid });
    }

    const { data: credential, error: credError } = await query.maybeSingle();

    if (credError || !credential) {
      throw new Error('Credential not found');
    }

    // Decrypt and return credential data
    const decryptedData = JSON.parse(
      new TextDecoder().decode(credential.encrypted_data)
    );

    // Log access
    await supabase.from('audit_logs').insert({
      customer_id: profile.customer_id,
      user_id: user.id,
      system_name: 'keeper',
      action_type: 'credential_access',
      action_details: {
        credential_name: credential.credential_name,
        record_uid: decryptedData.recordUid,
      },
      compliance_tags: ['security', 'credential_access'],
    });

    return new Response(
      JSON.stringify({
        success: true,
        credential: {
          title: decryptedData.title,
          login: decryptedData.login,
          password: decryptedData.password,
          url: decryptedData.url,
          notes: decryptedData.notes,
          custom: decryptedData.custom,
          lastSyncedAt: decryptedData.lastSyncedAt,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in keeper-get-credential:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
