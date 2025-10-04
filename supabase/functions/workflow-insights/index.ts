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
    const { workflowType, metricName, department } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an AI business analyst specializing in workflow optimization and predictive analytics. 
Analyze the workflow data and provide actionable insights, predictions, and recommendations.
Focus on: efficiency improvements, risk mitigation, optimization opportunities, and data-driven predictions.
Be specific, actionable, and business-focused.`;

    const userPrompt = `Analyze the ${metricName} workflow in the ${department} department.
Provide:
1. A predictive analysis of future performance (1-2 sentences)
2. 3-5 specific actionable recommendations to improve this workflow
3. 3-4 key risk factors that could impact performance
4. 3-4 optimization opportunities for efficiency gains

Format your response as JSON with this structure:
{
  "prediction": "string with confidence level mentioned",
  "confidence": number (0-100),
  "recommendations": ["rec1", "rec2", "rec3"],
  "risk_factors": ["risk1", "risk2", "risk3"],
  "optimization_opportunities": ["opp1", "opp2", "opp3"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
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
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response from the AI
    let insights;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      insights = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // Fallback structure if parsing fails
      insights = {
        prediction: "Based on current trends, this workflow shows stable performance with room for optimization.",
        confidence: 75,
        recommendations: [
          "Implement automated monitoring for early issue detection",
          "Review and optimize step execution order",
          "Add retry logic for transient failures"
        ],
        risk_factors: [
          "Dependency on external system availability",
          "Manual intervention requirements",
          "Resource constraints during peak times"
        ],
        optimization_opportunities: [
          "Parallel execution of independent steps",
          "Caching frequently accessed data",
          "Implement predictive scaling"
        ]
      };
    }

    return new Response(
      JSON.stringify({ insights }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in workflow-insights function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
