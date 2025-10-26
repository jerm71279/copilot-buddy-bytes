import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

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

    const { customer_id, max_distance = 3 } = await req.json();

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all global insights for correlation analysis
    const { data: insights, error: insightsError } = await supabase
      .from('global_insights')
      .select('id, insight_type, affected_departments, created_at, confidence, impact')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (insightsError || !insights) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch insights' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const correlations: any[] = [];

    // Calculate correlations between insights
    for (let i = 0; i < insights.length; i++) {
      for (let j = i + 1; j < insights.length; j++) {
        const insightA = insights[i];
        const insightB = insights[j];

        // 1. Temporal correlation (created within 24 hours)
        const timeDiff = Math.abs(
          new Date(insightA.created_at).getTime() - new Date(insightB.created_at).getTime()
        );
        const hoursApart = timeDiff / (1000 * 60 * 60);
        const temporalStrength = hoursApart <= 24 ? 1 - (hoursApart / 24) : 0;

        // 2. Thematic correlation (same insight type)
        const thematicStrength = insightA.insight_type === insightB.insight_type ? 0.8 : 0;

        // 3. Department overlap correlation
        const depsA = insightA.affected_departments || [];
        const depsB = insightB.affected_departments || [];
        const commonDeps = depsA.filter((d: string) => depsB.includes(d));
        const departmentalStrength = commonDeps.length / Math.max(depsA.length, depsB.length, 1);

        // 4. Impact correlation (similar impact levels)
        const impactMatch = insightA.impact === insightB.impact ? 0.7 : 0.3;

        // Composite correlation strength
        const correlationStrength = Math.min(1, 
          (temporalStrength * 0.3) + 
          (thematicStrength * 0.3) + 
          (departmentalStrength * 0.3) + 
          (impactMatch * 0.1)
        );

        // Only record significant correlations
        if (correlationStrength > 0.3) {
          // Determine correlation type
          let correlationType = 'thematic';
          if (temporalStrength > 0.7) correlationType = 'temporal';
          if (thematicStrength > 0.5 && temporalStrength > 0.5) correlationType = 'causal';
          if (departmentalStrength > 0.7) correlationType = 'reinforcing';

          // Calculate confidence based on data quality
          const confidenceScore = Math.min(1,
            ((insightA.confidence || 0.5) + (insightB.confidence || 0.5)) / 2
          );

          correlations.push({
            customer_id,
            insight_a_id: insightA.id,
            insight_b_id: insightB.id,
            correlation_type: correlationType,
            correlation_strength: Math.round(correlationStrength * 1000) / 1000,
            confidence_score: Math.round(confidenceScore * 1000) / 1000,
            edge_weight: correlationStrength,
            path_distance: 1,
            supporting_evidence: {
              temporal_score: Math.round(temporalStrength * 100) / 100,
              thematic_score: Math.round(thematicStrength * 100) / 100,
              departmental_overlap: commonDeps,
              hours_apart: Math.round(hoursApart * 10) / 10
            }
          });
        }
      }
    }

    // Insert correlations (upsert to avoid duplicates)
    if (correlations.length > 0) {
      const { error: insertError } = await supabase
        .from('insight_correlation_graph')
        .upsert(correlations, {
          onConflict: 'customer_id,insight_a_id,insight_b_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Error inserting correlations:', insertError);
      }
    }

    // Calculate graph metrics
    const nodeCount = insights.length;
    const edgeCount = correlations.length;
    const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;

    // Find strongly connected components (insights that reinforce each other)
    const strongClusters = correlations
      .filter(c => c.correlation_strength > 0.7 && c.correlation_type === 'reinforcing')
      .length;

    console.log(`Calculated ${correlations.length} correlations for ${insights.length} insights`);

    return new Response(
      JSON.stringify({
        success: true,
        correlations_calculated: correlations.length,
        total_insights: insights.length,
        graph_metrics: {
          nodes: nodeCount,
          edges: edgeCount,
          density: Math.round(density * 1000) / 1000,
          strong_clusters: strongClusters
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-correlation-graph:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
