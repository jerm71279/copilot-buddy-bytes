import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.customer_id) {
      return new Response(JSON.stringify({ error: 'No customer associated with user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();
    const { sourceSystem, sourceTable, sourceId, data: rawData, method = 'batch' } = requestData;

    if (!sourceSystem || !sourceTable || !rawData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dataSize = JSON.stringify(rawData).length;

    // Insert into bronze layer (raw data)
    const { data: ingested, error: ingestError } = await supabase
      .from('data_lake_raw')
      .insert({
        customer_id: profile.customer_id,
        source_system: sourceSystem.slice(0, 100),
        source_table: sourceTable.slice(0, 100),
        source_id: sourceId ? String(sourceId).slice(0, 200) : null,
        raw_data: rawData,
        ingestion_method: method,
        data_size_bytes: dataSize,
        metadata: {
          ingested_by: user.id,
          ingestion_source: 'api'
        }
      })
      .select()
      .single();

    if (ingestError) {
      console.error('Ingestion error:', ingestError);
      return new Response(JSON.stringify({ error: 'Failed to ingest data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log to pipeline runs
    await supabase
      .from('etl_pipeline_runs')
      .insert({
        customer_id: profile.customer_id,
        pipeline_name: `${sourceSystem}-ingestion`,
        pipeline_type: 'ingestion',
        source_system: sourceSystem,
        target_layer: 'bronze',
        status: 'completed',
        records_processed: 1,
        records_failed: 0,
        end_time: new Date().toISOString(),
        triggered_by: user.id
      });

    console.log('Data ingested successfully:', ingested.id);

    return new Response(JSON.stringify({ 
      success: true,
      id: ingested.id,
      dataSize: dataSize,
      timestamp: ingested.ingestion_timestamp
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in data-ingestion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});