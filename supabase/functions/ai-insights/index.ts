import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const requestData = await req.json();
    
    // Validate request body type
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract and validate query (required, max 1000 chars)
    const query = String(requestData.query || '').slice(0, 1000).trim();
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate context (optional, max 2000 chars)
    const context = requestData.context ? String(requestData.context).slice(0, 2000).trim() : undefined;

    // Validate domains array (optional, max 20 items, max 100 chars each)
    let domains: string[] | undefined;
    if (requestData.domains !== undefined) {
      if (!Array.isArray(requestData.domains)) {
        return new Response(
          JSON.stringify({ error: "domains must be an array" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (requestData.domains.length > 20) {
        return new Response(
          JSON.stringify({ error: "Maximum 20 domains allowed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      domains = requestData.domains
        .map((d: any) => String(d || '').slice(0, 100).trim())
        .filter((d: string) => d.length > 0);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build context-aware system prompt
    const systemPrompt = `You are an intelligent data analyst for OberaConnect platform. 
You analyze data across multiple business domains: HR, IT, Finance, Sales, Compliance, and Operations.

Context provided: ${context || 'General analysis'}
Domains in scope: ${domains?.join(', ') || 'All domains'}

Provide concise, actionable insights. Focus on:
- Key trends and patterns
- Anomalies or risks
- Actionable recommendations
- Cross-domain correlations

Keep responses under 200 words unless detailed analysis is requested.`;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const insight = data.choices[0]?.message?.content;

    if (!insight) {
      throw new Error("No insight generated");
    }

    // Store insight for future reference
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: insertError } = await supabase
      .from("ai_insights")
      .insert({
        query,
        insight,
        context,
        domains,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error("Failed to store insight:", insertError);
    }

    return new Response(
      JSON.stringify({ 
        insight,
        query,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI insights error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
