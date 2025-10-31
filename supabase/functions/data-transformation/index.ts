import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthContext } from "../_shared/supabaseAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { supabase, customerId } = await getAuthContext(authHeader);

    // Parse and validate request body
    const requestData = await req.json();
    
    // Validate request body type
    if (!requestData || typeof requestData !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract and validate required fields
    const rawDataId = requestData.rawDataId ? String(requestData.rawDataId).slice(0, 100) : null;
    const domain = String(requestData.domain || '').slice(0, 50).trim();
    const entityType = String(requestData.entityType || '').slice(0, 50).trim();
    const transformations = requestData.transformations;

    if (!rawDataId || !domain || !entityType) {
      return new Response(JSON.stringify({ error: 'rawDataId, domain, and entityType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate transformations array
    if (transformations !== undefined) {
      if (!Array.isArray(transformations)) {
        return new Response(JSON.stringify({ error: 'transformations must be an array' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (transformations.length > 100) {
        return new Response(JSON.stringify({ error: 'Maximum 100 transformation rules allowed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch raw data
    const { data: rawData, error: fetchError } = await supabase
      .from('data_lake_raw')
      .select('*')
      .eq('id', rawDataId)
      .eq('customer_id', customerId)
      .maybeSingle();

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
        // Validate and sanitize rule fields
        const ruleType = String(rule.type || '').slice(0, 50);
        const ruleFrom = rule.from ? String(rule.from).slice(0, 100) : null;
        const ruleTo = rule.to ? String(rule.to).slice(0, 100) : null;
        const ruleField = rule.field ? String(rule.field).slice(0, 100) : null;
        const ruleValue = rule.value;

        if (ruleType === 'rename' && ruleFrom && ruleTo) {
          if (transformedData[ruleFrom]) {
            transformedData[ruleTo] = transformedData[ruleFrom];
            delete transformedData[ruleFrom];
            appliedRules.push(`Renamed ${ruleFrom} to ${ruleTo}`);
          }
        } else if (ruleType === 'filter' && ruleField && ruleValue !== undefined) {
          if (transformedData[ruleField] === ruleValue) {
            appliedRules.push(`Filtered ${ruleField} = ${String(ruleValue).slice(0, 100)}`);
          }
        } else if (ruleType === 'enrich' && ruleField && ruleValue !== undefined) {
          // Sanitize value if it's a string
          const sanitizedValue = typeof ruleValue === 'string' 
            ? String(ruleValue).slice(0, 1000) 
            : ruleValue;
          transformedData[ruleField] = sanitizedValue;
          appliedRules.push(`Enriched ${ruleField}`);
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
        customer_id: customerId,
        raw_data_id: rawDataId,
        domain: domain,
        entity_type: entityType,
        entity_id: transformedData.id || null,
        transformed_data: transformedData,
        transformation_rules: appliedRules,
        quality_score: qualityScore,
        validation_status: qualityScore >= 80 ? 'validated' : 'failed',
        validation_errors: qualityScore < 80 ? { message: 'Data quality below threshold' } : null
      })
      .select()
      .maybeSingle();

    if (!transformed) {
      return new Response(JSON.stringify({ error: 'Failed to transform data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        customer_id: customerId,
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