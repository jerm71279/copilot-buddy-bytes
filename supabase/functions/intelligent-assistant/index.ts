import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { query, conversationId, customerId, userId } = await req.json();

    console.log("Processing intelligent query:", query);

    // Step 1: Retrieve relevant knowledge from knowledge base (RAG)
    const { data: relevantArticles, error: articlesError } = await supabaseClient
      .from("knowledge_articles")
      .select("id, title, content, tags, article_type")
      .eq("status", "published")
      .eq("customer_id", customerId)
      .limit(5);

    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
    }

    // Step 2: Get recent insights for context
    const { data: recentInsights, error: insightsError } = await supabaseClient
      .from("knowledge_insights")
      .select("title, description, confidence_score")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (insightsError) {
      console.error("Error fetching insights:", insightsError);
    }

    // Step 3: Get conversation history for context
    const { data: conversationHistory } = await supabaseClient
      .from("ai_interactions")
      .select("user_query, ai_response")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    // Build context from knowledge base
    let knowledgeContext = "";
    if (relevantArticles && relevantArticles.length > 0) {
      knowledgeContext = "\n\nRelevant Knowledge Base Articles:\n";
      relevantArticles.forEach((article) => {
        knowledgeContext += `\n[${article.article_type.toUpperCase()}] ${article.title}\n`;
        knowledgeContext += `${article.content.substring(0, 500)}...\n`;
      });
    }

    if (recentInsights && recentInsights.length > 0) {
      knowledgeContext += "\n\nRecent AI-Generated Insights:\n";
      recentInsights.forEach((insight) => {
        knowledgeContext += `\n- ${insight.title} (confidence: ${(insight.confidence_score * 100).toFixed(0)}%)\n`;
        knowledgeContext += `  ${insight.description}\n`;
      });
    }

    // Build conversation history
    const messages: any[] = [
      {
        role: "system",
        content: `You are an intelligent AI assistant integrated with a comprehensive knowledge base. Your role is to:

1. Answer questions using the provided knowledge base context
2. Generate actionable insights based on patterns you observe
3. Recommend improvements to processes and workflows
4. Identify gaps in knowledge that should be documented
5. Learn from each interaction to provide better responses

When generating insights:
- Be specific and actionable
- Provide confidence scores for your recommendations
- Reference knowledge base articles when applicable
- Identify opportunities for process improvement

${knowledgeContext}`,
      },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        messages.push({ role: "user", content: msg.user_query });
        messages.push({ role: "assistant", content: msg.ai_response });
      });
    }

    // Add current query
    messages.push({ role: "user", content: query });

    // Step 4: Call Lovable AI with knowledge context
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const assistantResponse = aiData.choices[0].message.content;

    // Step 5: Analyze response for insights
    const insightAnalysisResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Analyze the following conversation and extract any valuable insights that should be added to the knowledge base.

Return a JSON object with this structure:
{
  "has_insight": boolean,
  "insight_type": "process_improvement" | "knowledge_gap" | "pattern_discovery" | "best_practice",
  "title": "Brief title",
  "description": "Detailed description",
  "confidence_score": 0.0-1.0,
  "should_create_article": boolean,
  "suggested_tags": ["tag1", "tag2"]
}

If no valuable insight is found, return {"has_insight": false}`,
            },
            {
              role: "user",
              content: `User Query: ${query}\n\nAI Response: ${assistantResponse}`,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    let insightData = null;
    if (insightAnalysisResponse.ok) {
      const insightResult = await insightAnalysisResponse.json();
      const insightText = insightResult.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = insightText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          insightData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Failed to parse insight JSON:", e);
        }
      }
    }

    // Step 6: Log interaction
    const { data: interaction, error: logError } = await supabaseClient
      .from("ai_interactions")
      .insert({
        customer_id: customerId,
        user_id: userId,
        conversation_id: conversationId,
        interaction_type: "query",
        user_query: query,
        ai_response: assistantResponse,
        knowledge_sources: relevantArticles?.map((a) => a.id) || [],
        confidence_score: insightData?.confidence_score || 0.8,
        insight_generated: insightData?.has_insight || false,
        metadata: {
          articles_used: relevantArticles?.length || 0,
          insights_referenced: recentInsights?.length || 0,
        },
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to log interaction:", logError);
    }

    // Step 7: Create insight if valuable
    if (insightData?.has_insight && insightData?.confidence_score > 0.7) {
      const { error: insightError } = await supabaseClient
        .from("knowledge_insights")
        .insert({
          customer_id: customerId,
          insight_type: insightData.insight_type,
          title: insightData.title,
          description: insightData.description,
          confidence_score: insightData.confidence_score,
          status: "new",
          data_sources: {
            interaction_id: interaction?.id,
            query: query,
          },
        });

      if (insightError) {
        console.error("Failed to create insight:", insightError);
      }

      // Step 8: Auto-create knowledge article if recommended
      if (insightData.should_create_article) {
        const { error: articleError } = await supabaseClient
          .from("knowledge_articles")
          .insert({
            customer_id: customerId,
            created_by: userId,
            title: insightData.title,
            content: insightData.description,
            article_type: "guide",
            status: "draft",
            tags: insightData.suggested_tags || [],
            source_type: "ai_generated",
            source_metadata: {
              generated_from: "intelligent_assistant",
              interaction_id: interaction?.id,
              confidence_score: insightData.confidence_score,
            },
          });

        if (articleError) {
          console.error("Failed to create article:", articleError);
        }
      }
    }

    // Step 9: Update learning metrics
    const today = new Date().toISOString().split("T")[0];
    const { data: existingMetrics } = await supabaseClient
      .from("ai_learning_metrics")
      .select("*")
      .eq("customer_id", customerId)
      .eq("metric_date", today)
      .maybeSingle();

    if (existingMetrics) {
      await supabaseClient
        .from("ai_learning_metrics")
        .update({
          total_interactions: existingMetrics.total_interactions + 1,
          insights_generated: existingMetrics.insights_generated + (insightData?.has_insight ? 1 : 0),
        })
        .eq("id", existingMetrics.id);
    } else {
      await supabaseClient.from("ai_learning_metrics").insert({
        customer_id: customerId,
        metric_date: today,
        total_interactions: 1,
        insights_generated: insightData?.has_insight ? 1 : 0,
      });
    }

    return new Response(
      JSON.stringify({
        response: assistantResponse,
        sources: relevantArticles?.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.article_type,
        })),
        insight_generated: insightData?.has_insight || false,
        insight: insightData?.has_insight ? {
          title: insightData.title,
          confidence: insightData.confidence_score,
        } : null,
        conversation_id: conversationId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Intelligent assistant error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
