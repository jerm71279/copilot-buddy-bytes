import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id, department')
      .eq('user_id', user.id)
      .single();

    if (!profile?.customer_id) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { patternId, inputText, chainMode = false } = await req.json();

    if (!patternId || !inputText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: patternId, inputText' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    // Get pattern details
    const { data: pattern, error: patternError } = await supabase
      .from('ai_patterns')
      .select('*')
      .eq('id', patternId)
      .single();

    if (patternError || !pattern) {
      return new Response(
        JSON.stringify({ error: 'Pattern not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute pattern with Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: pattern.system_prompt },
          { role: 'user', content: inputText }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      // Log failed execution
      await supabase.from('ai_pattern_executions').insert({
        customer_id: profile.customer_id,
        pattern_id: patternId,
        user_id: user.id,
        department: profile.department,
        input_text: inputText,
        success: false,
        error_message: `AI Gateway error: ${aiResponse.status}`,
        execution_time_ms: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({ error: 'AI Gateway request failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const outputText = aiData.choices?.[0]?.message?.content || '';
    const executionTime = Date.now() - startTime;

    // Log execution to ai_pattern_executions
    const { error: logError } = await supabase
      .from('ai_pattern_executions')
      .insert({
        customer_id: profile.customer_id,
        pattern_id: patternId,
        user_id: user.id,
        department: profile.department,
        input_text: inputText,
        output_text: outputText,
        execution_time_ms: executionTime,
        model_used: 'google/gemini-2.5-flash',
        success: true,
        metadata: {
          pattern_name: pattern.pattern_name,
          pattern_category: pattern.category,
          input_length: inputText.length,
          output_length: outputText.length,
        },
      });

    if (logError) {
      console.error('Error logging execution:', logError);
    }

    // Also log to ai_interactions for Layer 1 learning
    await supabase.from('ai_interactions').insert({
      customer_id: profile.customer_id,
      user_id: user.id,
      department: profile.department,
      query: inputText,
      response: outputText,
      context_type: 'pattern_execution',
      interaction_metadata: {
        pattern_id: patternId,
        pattern_name: pattern.pattern_name,
        pattern_category: pattern.category,
        execution_time_ms: executionTime,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        output: outputText,
        executionTime,
        pattern: {
          id: pattern.id,
          name: pattern.pattern_name,
          category: pattern.category,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pattern-executor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
