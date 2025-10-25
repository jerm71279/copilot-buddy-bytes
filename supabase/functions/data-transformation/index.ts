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
    const { rawDataId, domain, entityType, transformations } = requestData;

    if (!rawDataId || !domain || !entityType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch raw data
    const { data: rawData, error: fetchError } = await supabase
      .from('data_lake_raw')
      .select('*')
      .eq('id', rawDataId)
      .eq('customer_id', profile.customer_id)
      .single();

    if (fetchError || !rawData) {
      return new Response(JSON.stringify({ error: 'Raw data not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply transformations
    let transformedData = { ...rawData.raw_data };
    const appliedRules: string[] = [];

    if (transformations && Array.isArray(transformations)) {
      for (const rule of transformations) {
        if (rule.type === 'rename' && rule.from && rule.to) {
          if (transformedData[rule.from]) {
            transformedData[rule.to] = transformedData[rule.from];
            delete transformedData[rule.from];
            appliedRules.push(`Renamed ${rule.from} to ${rule.to}`);
          }
        } else if (rule.type === 'filter' && rule.field && rule.value) {
          if (transformedData[rule.field] === rule.value) {
            appliedRules.push(`Filtered ${rule.field} = ${rule.value}`);
          }
        } else if (rule.type === 'enrich' && rule.field && rule.value) {
          transformedData[rule.field] = rule.value;
          appliedRules.push(`Enriched ${rule.field}`);
        }
      }
    }

    // Calculate quality score
    let qualityScore = 100;
    const requiredFields = ['id', 'created_at'];
    for (const field of requiredFields) {
      if (!transformedData[field]) {
        qualityScore -= 20;
      }
    }

    // Insert into silver layer
    const { data: transformed, error: transformError } = await supabase
      .from('data_lake_silver')
      .insert({
        customer_id: profile.customer_id,
        raw_data_id: rawDataId,
        domain: domain.slice(0, 50),
        entity_type: entityType.slice(0, 50),
        entity_id: transformedData.id || null,
        transformed_data: transformedData,
        transformation_rules: appliedRules,
        quality_score: qualityScore,
        validation_status: qualityScore >= 80 ? 'validated' : 'failed',
        validation_errors: qualityScore < 80 ? { message: 'Data quality below threshold' } : null
      })
      .select()
      .single();

    if (transformError) {
      console.error('Transformation error:', transformError);
      return new Response(JSON.stringify({ error: 'Failed to transform data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log lineage
    await supabase
      .from('data_lineage')
      .insert({
        customer_id: profile.customer_id,
        source_entity_type: 'raw',
        source_entity_id: rawDataId,
        target_entity_type: 'silver',
        target_entity_id: transformed.id,
        transformation_type: 'transform',
        transformation_logic: appliedRules.join('; ')
      });

    console.log('Data transformed successfully:', transformed.id);

    return new Response(JSON.stringify({ 
      success: true,
      id: transformed.id,
      qualityScore,
      rulesApplied: appliedRules.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in data-transformation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});