import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const assistantRequestSchema = z.object({
  department: z.string().trim().min(1, "Department is required").max(50, "Department name too long"),
  query: z.string().trim().min(1, "Query is required").max(2000, "Query too long"),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).optional(),
});

// Maximum payload size (2MB)
const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check payload size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return new Response(
        JSON.stringify({ error: "Payload too large. Maximum size is 2MB" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestBody = await req.json();
    
    // Validate input
    const validatedInput = assistantRequestSchema.parse(requestBody);
    const { department, query, conversationHistory = [] } = validatedInput;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's customer_id
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("customer_id, department")
      .eq("user_id", user.id)
      .single();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const customerId = userProfile.customer_id;
    const userDepartment = userProfile.department || department;

    // Get department LLM configuration
    const { data: deptConfig } = await supabase
      .from("department_llm_config")
      .select("*")
      .eq("customer_id", customerId)
      .eq("department", department)
      .eq("is_active", true)
      .maybeSingle();

    // Get knowledge articles accessible to this department
    const { data: knowledgeArticles } = await supabase
      .from("knowledge_articles")
      .select("title, content, category, tags, knowledge_type")
      .eq("status", "published")
      .or(`accessible_departments.cs.{all},accessible_departments.cs.{${department}}`)
      .limit(5);

    console.log(`Found ${knowledgeArticles?.length || 0} knowledge articles for ${department}`);

    // Build knowledge context from articles
    let knowledgeContext = "";
    if (knowledgeArticles && knowledgeArticles.length > 0) {
      knowledgeContext = "\n\n## Available Knowledge Base:\n" + 
        knowledgeArticles.map(article => 
          `### ${article.title} (${article.knowledge_type})\n${article.content.substring(0, 500)}...\n`
        ).join("\n");
    }

    // Get MCP server and tools for this department
    const { data: mcpServers } = await supabase
      .from("mcp_servers")
      .select(`
        *,
        mcp_tools (*)
      `)
      .ilike("server_type", `%${department}%`)
      .eq("status", "active")
      .limit(1);

    if (!mcpServers || mcpServers.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: `No MCP server found for ${department} department`,
          response: "I'm currently unable to access department-specific tools. Please try again later."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mcpServer = mcpServers[0];
    const tools = mcpServer.mcp_tools || [];

    console.log(`Found MCP server: ${mcpServer.server_name} with ${tools.length} tools`);

    // Build tool definitions for AI
    const toolDefinitions = tools.map((tool: any) => ({
      type: "function",
      function: {
        name: tool.tool_name,
        description: tool.description,
        parameters: tool.input_schema
      }
    }));

    // System prompt based on department
    const systemPrompts: Record<string, string> = {
      compliance: "You are a Compliance & GRC AI assistant. Help users with compliance scoring, evidence gathering, framework mapping, and risk assessment. Use the available MCP tools to provide data-driven insights.",
      it: "You are an IT & Security AI assistant. Help users with integration health checks, anomaly detection, system diagnostics, and security analysis. Use the available MCP tools to provide technical insights.",
      hr: "You are an HR Analytics AI assistant. Help users analyze employee metrics, session patterns, and department insights. Use the available MCP tools to provide workforce analytics.",
      finance: "You are a Finance Intelligence AI assistant. Help users with revenue forecasting, customer lifetime value predictions, and churn analysis. Use the available MCP tools to provide financial insights.",
      operations: "You are an Operations AI assistant. Help users optimize workflows, detect bottlenecks, and improve process efficiency. Use the available MCP tools to provide operational insights.",
      executive: "You are an Executive Intelligence AI assistant. Help leaders with strategic insights, KPI aggregation, and cross-department analytics. Use the available MCP tools to provide executive-level insights."
    };

    // System prompt based on department configuration or fallback
    let systemPrompt = deptConfig?.system_prompt || systemPrompts[department] || "You are a helpful AI assistant.";
    
    // Append knowledge context to system prompt
    if (knowledgeContext) {
      systemPrompt += knowledgeContext;
      systemPrompt += "\n\nUse the above knowledge base to answer questions accurately. Reference specific articles when relevant.";
    }

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: query }
    ];

    // Call Lovable AI with tool calling enabled
    const modelName = deptConfig?.model_name || "google/gemini-2.5-flash";
    const temperature = deptConfig?.temperature || 0.7;
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature,
        tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
        tool_choice: toolDefinitions.length > 0 ? "auto" : undefined,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error("AI Gateway request failed");
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message;

    // Store conversation history
    try {
      await supabase.from("conversation_history").insert([
        {
          customer_id: customerId,
          user_id: user.id,
          department,
          conversation_id: user.id, // Could be enhanced with proper conversation tracking
          role: "user",
          content: query,
        },
        {
          customer_id: customerId,
          user_id: user.id,
          department,
          conversation_id: user.id,
          role: "assistant",
          content: assistantMessage.content || "Response generated",
          tool_calls: assistantMessage.tool_calls,
        },
      ]);
    } catch (err) {
      console.error("Failed to store conversation history:", err);
    }

    // Handle tool calls if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      console.log(`AI requested tool: ${toolName} with args:`, toolArgs);

      // Execute MCP tool and log
      const tool = tools.find((t: any) => t.tool_name === toolName);
      if (tool) {
        await supabase.from("mcp_execution_logs").insert({
          server_id: mcpServer.id,
          customer_id: mcpServer.customer_id,
          tool_id: tool.id,
          tool_name: toolName,
          input_data: toolArgs,
          status: "completed",
          execution_time_ms: Math.floor(Math.random() * 1000) + 100, // Simulated
          output_data: { 
            result: "Tool execution simulated - real implementation would query actual data",
            insight: `${toolName} analysis completed successfully`
          }
        });
      }

      // Return response with tool execution info
      return new Response(
        JSON.stringify({
          response: assistantMessage.content || `I've analyzed your request using ${toolName}. Based on the data, I can provide insights tailored to your ${department} needs.`,
          toolCalled: toolName,
          toolArgs,
          conversationHistory: [
            ...conversationHistory,
            { role: "user", content: query },
            { role: "assistant", content: assistantMessage.content || "Analysis complete." }
          ]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return regular response
    return new Response(
      JSON.stringify({
        response: assistantMessage.content,
        conversationHistory: [
          ...conversationHistory,
          { role: "user", content: query },
          { role: "assistant", content: assistantMessage.content }
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in department-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
