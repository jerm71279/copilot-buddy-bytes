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

    const { customer_id, period_days = 7 } = await req.json();

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const periodStart = new Date(Date.now() - period_days * 24 * 60 * 60 * 1000).toISOString();
    const periodEnd = new Date().toISOString();

    // Analyze AB test results by model
    const { data: abResults, error: abError } = await supabase
      .from('ai_ab_test_results')
      .select(`
        *,
        ai_ab_test_variants (
          variant_name,
          model_config,
          prompt_strategy
        )
      `)
      .eq('customer_id', customer_id)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    if (abError) {
      console.error('Error fetching AB results:', abError);
    }

    // Analyze AI interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('customer_id', customer_id)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
    }

    // Group results by model and use case
    const modelPerformance = new Map<string, any>();

    // Process AB test results
    if (abResults && abResults.length > 0) {
      abResults.forEach((result: any) => {
        const variant = result.ai_ab_test_variants;
        if (!variant) return;

        const modelConfig = variant.model_config as any;
        const modelName = modelConfig.model || 'google/gemini-2.5-flash';
        const useCase = result.metadata?.use_case || 'general';
        const key = `${modelName}:${useCase}`;

        if (!modelPerformance.has(key)) {
          modelPerformance.set(key, {
            model_name: modelName,
            use_case: useCase,
            confidence_scores: [],
            response_times: [],
            user_ratings: [],
            helpful_count: 0,
            not_helpful_count: 0,
            total_invocations: 0,
            temperature_values: [],
            max_token_values: []
          });
        }

        const perf = modelPerformance.get(key);
        perf.total_invocations++;
        if (result.confidence_score) perf.confidence_scores.push(result.confidence_score);
        if (result.response_time_ms) perf.response_times.push(result.response_time_ms);
        if (result.user_rating) perf.user_ratings.push(result.user_rating);
        if (result.was_helpful === true) perf.helpful_count++;
        if (result.was_helpful === false) perf.not_helpful_count++;
        if (modelConfig.temperature) perf.temperature_values.push(modelConfig.temperature);
        if (modelConfig.max_tokens) perf.max_token_values.push(modelConfig.max_tokens);
      });
    }

    // Process general AI interactions (for models not in AB tests)
    if (interactions && interactions.length > 0) {
      interactions.forEach((interaction: any) => {
        const modelName = interaction.model_used || 'google/gemini-2.5-flash';
        const useCase = 'general';
        const key = `${modelName}:${useCase}`;

        if (!modelPerformance.has(key)) {
          modelPerformance.set(key, {
            model_name: modelName,
            use_case: useCase,
            confidence_scores: [],
            response_times: [],
            user_ratings: [],
            helpful_count: 0,
            not_helpful_count: 0,
            total_invocations: 0,
            temperature_values: [],
            max_token_values: []
          });
        }

        const perf = modelPerformance.get(key);
        perf.total_invocations++;
        if (interaction.confidence_score) perf.confidence_scores.push(interaction.confidence_score);
        if (interaction.was_helpful === true) perf.helpful_count++;
        if (interaction.was_helpful === false) perf.not_helpful_count++;
      });
    }

    // Calculate aggregate metrics and optimal parameters
    const performanceRecords: any[] = [];

    modelPerformance.forEach((perf, key) => {
      const avgConfidence = perf.confidence_scores.length > 0
        ? perf.confidence_scores.reduce((a: number, b: number) => a + b, 0) / perf.confidence_scores.length
        : null;

      const avgResponseTime = perf.response_times.length > 0
        ? Math.round(perf.response_times.reduce((a: number, b: number) => a + b, 0) / perf.response_times.length)
        : null;

      const successRate = perf.total_invocations > 0
        ? ((perf.helpful_count / (perf.helpful_count + perf.not_helpful_count)) * 100) || null
        : null;

      const userSatisfaction = perf.user_ratings.length > 0
        ? perf.user_ratings.reduce((a: number, b: number) => a + b, 0) / perf.user_ratings.length
        : null;

      // Calculate optimal temperature (prefer values that had high confidence)
      let optimalTemperature = null;
      if (perf.temperature_values.length > 0) {
        optimalTemperature = perf.temperature_values.reduce((a: number, b: number) => a + b, 0) / perf.temperature_values.length;
        optimalTemperature = Math.round(optimalTemperature * 100) / 100;
      }

      // Calculate optimal max_tokens
      let optimalMaxTokens = null;
      if (perf.max_token_values.length > 0) {
        optimalMaxTokens = Math.round(
          perf.max_token_values.reduce((a: number, b: number) => a + b, 0) / perf.max_token_values.length
        );
      }

      // Estimate cost per invocation (rough estimates)
      const costPerInvocation = perf.model_name.includes('gpt-5') ? 0.05 :
                               perf.model_name.includes('gemini-2.5-pro') ? 0.03 :
                               perf.model_name.includes('gemini-2.5-flash') ? 0.01 : 0.02;

      performanceRecords.push({
        customer_id,
        model_name: perf.model_name,
        use_case: perf.use_case,
        avg_confidence_score: avgConfidence ? Math.round(avgConfidence * 1000) / 1000 : null,
        avg_response_time_ms: avgResponseTime,
        success_rate: successRate ? Math.round(successRate * 100) / 100 : null,
        user_satisfaction: userSatisfaction ? Math.round(userSatisfaction * 100) / 100 : null,
        total_invocations: perf.total_invocations,
        sample_period_start: periodStart,
        sample_period_end: periodEnd,
        optimal_temperature: optimalTemperature,
        optimal_max_tokens: optimalMaxTokens,
        cost_per_invocation: costPerInvocation,
        metadata: {
          helpful_count: perf.helpful_count,
          not_helpful_count: perf.not_helpful_count,
          sample_size: perf.total_invocations
        }
      });
    });

    // Insert performance records
    if (performanceRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('ai_model_performance')
        .insert(performanceRecords);

      if (insertError) {
        console.error('Error inserting performance records:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store performance records' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Find best performing model per use case
    const recommendations: any[] = [];
    const useCases = new Set(performanceRecords.map(r => r.use_case));

    useCases.forEach(useCase => {
      const useCaseRecords = performanceRecords.filter(r => r.use_case === useCase);
      
      // Score based on: confidence (40%), success_rate (30%), response_time (20%), user_satisfaction (10%)
      const scored = useCaseRecords.map(r => ({
        ...r,
        composite_score: 
          (r.avg_confidence_score || 0) * 0.4 +
          ((r.success_rate || 0) / 100) * 0.3 +
          (1 - Math.min(1, (r.avg_response_time_ms || 1000) / 5000)) * 0.2 +
          ((r.user_satisfaction || 0) / 5) * 0.1
      }));

      scored.sort((a, b) => b.composite_score - a.composite_score);
      
      if (scored.length > 0) {
        recommendations.push({
          use_case: useCase,
          recommended_model: scored[0].model_name,
          optimal_temperature: scored[0].optimal_temperature,
          optimal_max_tokens: scored[0].optimal_max_tokens,
          expected_confidence: scored[0].avg_confidence_score,
          expected_response_time: scored[0].avg_response_time_ms,
          composite_score: Math.round(scored[0].composite_score * 1000) / 1000
        });
      }
    });

    console.log(`Analyzed ${performanceRecords.length} model configurations for customer ${customer_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        performance_records: performanceRecords.length,
        recommendations,
        period_days,
        total_interactions_analyzed: (abResults?.length || 0) + (interactions?.length || 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tune-model-performance:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
