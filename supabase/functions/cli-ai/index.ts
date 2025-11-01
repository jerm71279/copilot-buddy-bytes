import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model, prompt } = await req.json();

    if (!model || !prompt) {
      return new Response(
        JSON.stringify({ error: 'model and prompt are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lovable AI models (Gemini & GPT)
    if (model.includes('gemini') || model.includes('gpt')) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const modelMap: Record<string, string> = {
        'gemini-pro': 'google/gemini-2.5-pro',
        'gemini-flash': 'google/gemini-2.5-flash',
        'gemini-lite': 'google/gemini-2.5-flash-lite',
        'gpt-5': 'openai/gpt-5',
        'gpt-5-mini': 'openai/gpt-5-mini',
        'gpt-5-nano': 'openai/gpt-5-nano',
      };

      const aiModel = modelMap[model] || 'google/gemini-2.5-flash';

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "AI request failed", details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      return new Response(
        JSON.stringify({ response: content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perplexity models
    if (model.includes('perplexity')) {
      const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
      if (!PERPLEXITY_API_KEY) {
        return new Response(
          JSON.stringify({ error: "PERPLEXITY_API_KEY not configured. Add it via secrets." }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Perplexity request failed", details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      return new Response(
        JSON.stringify({ response: content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid model. Use: gemini-pro, gemini-flash, gpt-5, gpt-5-mini, perplexity' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cli-ai:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
