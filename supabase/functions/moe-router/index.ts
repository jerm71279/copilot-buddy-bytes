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
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const query = String(requestData.query || '').slice(0, 10000);
    const queryType = String(requestData.queryType || 'general').slice(0, 100);
    const useMultipleExperts = Boolean(requestData.useMultipleExperts);

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    // Fetch active experts for this customer
    const { data: experts, error: expertsError } = await supabase
      .from('ai_experts')
      .select('*')
      .eq('customer_id', profile.customer_id)
      .eq('is_active', true)
      .order('performance_score', { ascending: false });

    if (expertsError) {
      console.error('Error fetching experts:', expertsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch experts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no experts configured, return error
    if (!experts || experts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No experts configured for this customer' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route to expert(s) using simple scoring
    const scoredExperts = experts.map(expert => {
      let score = expert.performance_score || 0.5;
      
      // Boost score if specialization matches query type
      if (expert.specialization === queryType) {
        score += 0.3;
      }
      
      // Boost for reasoning queries
      if (queryType === 'reasoning' && expert.specialization === 'reasoning') {
        score += 0.2;
      }
      
      // Boost for vision queries
      if (queryType === 'vision' && expert.specialization === 'vision') {
        score += 0.2;
      }
      
      // Boost for code queries
      if (queryType === 'code' && expert.specialization === 'code') {
        score += 0.2;
      }
      
      return { ...expert, routingScore: score };
    });

    // Sort by routing score
    scoredExperts.sort((a, b) => b.routingScore - a.routingScore);

    const selectedExperts = useMultipleExperts 
      ? scoredExperts.slice(0, 3) 
      : [scoredExperts[0]];

    // Execute query with selected expert(s)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responses = await Promise.all(
      selectedExperts.map(async (expert) => {
        try {
          if (expert.expert_type === 'model') {
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: expert.model_or_function,
                messages: [{ role: "user", content: query }],
                ...expert.config,
              }),
            });

            if (!response.ok) {
              throw new Error(`AI request failed: ${response.status}`);
            }

            const data = await response.json();
            return {
              expertId: expert.id,
              expertName: expert.expert_name,
              content: data.choices?.[0]?.message?.content || '',
              success: true,
            };
          } else {
            // For function/department types, return placeholder
            return {
              expertId: expert.id,
              expertName: expert.expert_name,
              content: `Expert ${expert.expert_name} would handle this query.`,
              success: true,
            };
          }
        } catch (error) {
          console.error(`Error with expert ${expert.expert_name}:`, error);
          return {
            expertId: expert.id,
            expertName: expert.expert_name,
            content: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const responseTime = Date.now() - startTime;

    // Log routing decisions
    for (let i = 0; i < selectedExperts.length; i++) {
      const expert = selectedExperts[i];
      const response = responses[i];
      
      await supabase.from('moe_routing_decisions').insert({
        customer_id: profile.customer_id,
        user_id: user.id,
        query: query.slice(0, 1000),
        query_type: queryType,
        selected_expert_id: expert.id,
        expert_name: expert.expert_name,
        confidence_score: expert.routingScore,
        response_time_ms: responseTime,
        success: response.success,
        metadata: {
          expertType: expert.expert_type,
          specialization: expert.specialization,
        },
      });
    }

    // Combine responses if multiple experts
    let finalResponse = '';
    if (useMultipleExperts && responses.length > 1) {
      const successfulResponses = responses.filter(r => r.success);
      finalResponse = successfulResponses
        .map(r => `**${r.expertName}:**\n${r.content}`)
        .join('\n\n---\n\n');
    } else {
      finalResponse = responses[0]?.content || '';
    }

    return new Response(
      JSON.stringify({
        response: finalResponse,
        selectedExperts: selectedExperts.map(e => ({
          id: e.id,
          name: e.expert_name,
          specialization: e.specialization,
          score: e.routingScore,
        })),
        responseTime,
        useMultipleExperts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in moe-router:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});