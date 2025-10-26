import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ABTestRequest {
  test_name: string;
  query: string;
  user_context?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { test_name, query, user_context }: ABTestRequest = await req.json();

    if (!test_name || !query) {
      return new Response(
        JSON.stringify({ error: 'test_name and query are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's customer_id
    const authHeader = req.headers.get('Authorization');
    let customer_id: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        customer_id = profile?.customer_id;
      }
    }

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active variants for this test
    const { data: variants, error: variantsError } = await supabase
      .from('ai_ab_test_variants')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('test_name', test_name)
      .eq('is_active', true);

    if (variantsError || !variants || variants.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active variants found for this test' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select variant using weighted random selection
    // For now, simple random selection (can enhance with statistical distribution later)
    const selectedVariant = variants[Math.floor(Math.random() * variants.length)];

    // Call Lovable AI with variant's configuration
    const startTime = Date.now();
    
    const promptStrategy = selectedVariant.prompt_strategy as any;
    const modelConfig = selectedVariant.model_config as any;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelConfig.model || 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: promptStrategy.system_prompt || 'You are a helpful AI assistant.'
          },
          { role: 'user', content: query }
        ],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens
      })
    });

    const responseTime = Date.now() - startTime;

    if (!aiResponse.ok) {
      console.error('AI Gateway error:', await aiResponse.text());
      return new Response(
        JSON.stringify({ error: 'AI Gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || '';

    // Extract confidence score if available
    const confidenceScore = aiData.confidence_score || null;

    // Log result to database
    const { error: logError } = await supabase
      .from('ai_ab_test_results')
      .insert({
        customer_id,
        variant_id: selectedVariant.id,
        user_id: user_context?.user_id,
        query_text: query.substring(0, 1000), // Limit to 1000 chars
        response_text: responseText.substring(0, 2000),
        confidence_score: confidenceScore,
        response_time_ms: responseTime,
        metadata: {
          variant_name: selectedVariant.variant_name,
          user_context
        }
      });

    if (logError) {
      console.error('Error logging AB test result:', logError);
    }

    console.log(`AB Test: ${test_name} | Variant: ${selectedVariant.variant_name} | Time: ${responseTime}ms`);

    return new Response(
      JSON.stringify({
        response: responseText,
        variant_name: selectedVariant.variant_name,
        variant_id: selectedVariant.id,
        response_time_ms: responseTime,
        confidence_score: confidenceScore
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ab-test-router:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
