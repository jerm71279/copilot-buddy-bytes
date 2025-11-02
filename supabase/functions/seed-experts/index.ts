import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if experts already exist
    const { data: existingExperts } = await supabase
      .from('ai_experts')
      .select('id')
      .eq('customer_id', profile.customer_id)
      .limit(1);

    if (existingExperts && existingExperts.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Experts already seeded for this customer' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Seed default experts
    const defaultExperts = [
      {
        customer_id: profile.customer_id,
        expert_name: 'Gemini Pro - Reasoning Expert',
        expert_type: 'model',
        specialization: 'reasoning',
        model_or_function: 'google/gemini-2.5-pro',
        performance_score: 0.7,
        config: { temperature: 0.7, max_tokens: 2000 },
      },
      {
        customer_id: profile.customer_id,
        expert_name: 'Gemini Flash - Fast Response',
        expert_type: 'model',
        specialization: 'fast_response',
        model_or_function: 'google/gemini-2.5-flash',
        performance_score: 0.8,
        config: { temperature: 0.5, max_tokens: 1000 },
      },
      {
        customer_id: profile.customer_id,
        expert_name: 'Gemini Flash Lite - Quick Answers',
        expert_type: 'model',
        specialization: 'general',
        model_or_function: 'google/gemini-2.5-flash-lite',
        performance_score: 0.6,
        config: { temperature: 0.3, max_tokens: 500 },
      },
      {
        customer_id: profile.customer_id,
        expert_name: 'GPT-5 - Advanced Reasoning',
        expert_type: 'model',
        specialization: 'reasoning',
        model_or_function: 'openai/gpt-5',
        performance_score: 0.75,
        config: { temperature: 0.7, max_tokens: 2000 },
      },
      {
        customer_id: profile.customer_id,
        expert_name: 'GPT-5 Mini - Balanced',
        expert_type: 'model',
        specialization: 'general',
        model_or_function: 'openai/gpt-5-mini',
        performance_score: 0.7,
        config: { temperature: 0.5, max_tokens: 1500 },
      },
      {
        customer_id: profile.customer_id,
        expert_name: 'GPT-5 Nano - Speed',
        expert_type: 'model',
        specialization: 'fast_response',
        model_or_function: 'openai/gpt-5-nano',
        performance_score: 0.65,
        config: { temperature: 0.3, max_tokens: 500 },
      },
    ];

    const { data: insertedExperts, error: insertError } = await supabase
      .from('ai_experts')
      .insert(defaultExperts)
      .select();

    if (insertError) {
      console.error('Error seeding experts:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to seed experts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Successfully seeded experts',
        experts: insertedExperts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in seed-experts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});