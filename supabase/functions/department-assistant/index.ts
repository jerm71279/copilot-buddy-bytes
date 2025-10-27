import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthContext } from '../_shared/supabaseAuth.ts';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { extractKeywords, calculateTextSimilarity } from '../_shared/textUtils.ts';
import { calculateFrequencyConfidence } from '../_shared/confidenceScoring.ts';
import { 
  detectRepeatedQueries, 
  detectBottlenecks, 
  detectOpportunities,
  detectAllPatterns 
} from '../_shared/patternDetection.ts';
import {
  sanitizeUnicode,
  detectPromptInjection,
  sanitizeIndirectContent,
  addInputDelimiters,
  filterOutput,
  validateToolCall,
  createSecureSystemPrompt,
  trackThreat,
} from '../_shared/promptSecurity.ts';
import {
  logSecurityEvent,
  createPromptInjectionLog,
  createToolCallValidationLog,
  createRateLimitLog,
} from '../_shared/securityAudit.ts';

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
  templateId: z.string().uuid().optional(),
  useContextInjection: z.boolean().optional(),
});

// Maximum payload size (2MB)
const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024;

// Insight generation using shared pattern detection modules
async function generateInsightsIfNeeded(
  supabase: any,
  customerId: string,
  department: string,
  userId: string,
  userQuery: string,
  assistantResponse: string,
  conversationIds: string[]
) {
  // Analyze recent conversations to detect patterns
  const { data: recentConvs } = await supabase
    .from("conversation_history")
    .select("*")
    .eq("customer_id", customerId)
    .eq("department", department)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!recentConvs || recentConvs.length < 10) {
    return; // Need at least 10 conversations to detect patterns
  }

  // Use shared pattern detection module to detect all patterns at once
  const patterns = detectAllPatterns(recentConvs as any[], {
    minFrequency: 3,
    minConfidence: 0.65,
    timeWindowDays: 7
  });

  console.log(`Detected ${patterns.length} patterns for ${department}`);

  // Process detected patterns and store as insights
  for (const pattern of patterns) {
    // Check if insight already exists
    const { data: existingInsight } = await supabase
      .from("department_insights")
      .select("id, frequency_count")
      .eq("customer_id", customerId)
      .eq("department", department)
      .eq("insight_type", pattern.patternType)
      .ilike("title", `%${pattern.title.slice(0, 30)}%`)
      .maybeSingle();

    if (existingInsight) {
      // Update existing insight with incremented frequency
      await supabase
        .from("department_insights")
        .update({
          frequency_count: existingInsight.frequency_count + 1,
          last_detected_at: new Date().toISOString(),
          confidence_score: pattern.confidence,
          impact_score: pattern.impact
        })
        .eq("id", existingInsight.id);
    } else {
      // Create new insight from detected pattern
      await supabase
        .from("department_insights")
        .insert({
          customer_id: customerId,
          department,
          insight_type: pattern.patternType,
          title: pattern.title,
          description: pattern.description,
          confidence_score: pattern.confidence,
          impact_score: pattern.impact,
          supporting_interactions: pattern.supportingConversations.slice(0, 10),
          affected_users: pattern.affectedUsers || 1,
          frequency_count: pattern.frequency,
          metadata: {
            detection_method: "shared_pattern_detection_module",
            pattern_details: pattern.metadata,
            evidence_count: pattern.supportingConversations.length,
            common_keywords: pattern.commonKeywords,
            common_phrases: pattern.commonPhrases
          }
        });
    }
  }
}

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
    let { 
      department, 
      query, 
      conversationHistory = [], 
      templateId, 
      useContextInjection = true 
    } = validatedInput;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get authorization header and authenticate user FIRST
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Use shared auth module for authentication and customer context
    const { supabase, userId, customerId } = await getAuthContext(authHeader);

    // SECURITY: Sanitize Unicode and detect prompt injection AFTER auth
    query = sanitizeUnicode(query);
    department = sanitizeUnicode(department);
    
    const injectionCheck = detectPromptInjection(query);
    if (!injectionCheck.isValid) {
      console.warn(`Prompt injection detected from user ${userId}: ${injectionCheck.threat}`);
      
      // Log security event
      await logSecurityEvent(
        supabase,
        createPromptInjectionLog(
          'department-assistant',
          userId,
          customerId,
          injectionCheck.threat || 'unknown',
          injectionCheck.confidence,
          query,
          true // blocked
        )
      );
      
      // Track suspicious activity
      const allowed = trackThreat(userId, injectionCheck.threat || 'unknown');
      if (!allowed) {
        await logSecurityEvent(
          supabase,
          createRateLimitLog('department-assistant', userId, customerId, 5)
        );
        
        return new Response(
          JSON.stringify({ 
            error: 'Too many suspicious requests. Please contact support.',
            code: 'RATE_LIMITED'
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Your request contains suspicious content. Please rephrase and try again.',
          threat: injectionCheck.threat
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("department")
      .eq("user_id", userId)
      .maybeSingle();

    if (!userProfile) {
      throw new Error("User profile not found");
    }
    const userDepartment = userProfile?.department || department;

    // Get department LLM configuration
    const { data: deptConfig } = await supabase
      .from("department_llm_config")
      .select("*")
      .eq("customer_id", customerId)
      .eq("department", department)
      .eq("is_active", true)
      .maybeSingle();

    // PHASE 4: Fetch relevant global insights and feedback for this department
    const { data: globalFeedback } = await supabase
      .from('insight_feedback')
      .select(`
        *,
        global_insights (
          insight_type,
          title,
          description,
          confidence_score,
          affected_departments,
          recommended_actions
        )
      `)
      .eq('customer_id', customerId)
      .eq('department', department)
      .eq('acknowledged', false)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`Found ${globalFeedback?.length || 0} global feedback items for ${department}`);

    // Get knowledge articles accessible to this department
    const { data: knowledgeArticles } = await supabase
      .from("knowledge_articles")
      .select("title, content, category, tags, knowledge_type")
      .eq("status", "published")
      .or(`accessible_departments.cs.{all},accessible_departments.cs.{${department}}`)
      .limit(5);

    console.log(`Found ${knowledgeArticles?.length || 0} knowledge articles for ${department}`);

    // NEW: Fetch and apply prompt template if provided
    let promptTemplate: any = null;
    let contextInjected: string[] = [];
    let enhancedQuery = query;

    if (templateId) {
      const { data: template } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("id", templateId)
        .eq("is_active", true)
        .maybeSingle();

      if (template) {
        promptTemplate = template;
        console.log(`Using template: ${template.template_name}`);

        // Increment usage count
        await supabase.rpc("increment_template_usage", { template_id_param: templateId });

        // Context injection based on hints
        if (useContextInjection && template.context_hints?.inject) {
          const hints = template.context_hints.inject;
          let businessContext = "\n\n=== INJECTED BUSINESS CONTEXT ===\n";

          // Inject recent metrics if requested
          if (hints.includes("recent_metrics") || hints.includes("department_kpis")) {
            const { data: recentMetrics } = await supabase
              .from("workflow_executions")
              .select("workflow_name, status, executed_at")
              .eq("customer_id", customerId)
              .gte("executed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
              .order("executed_at", { ascending: false })
              .limit(10);

            if (recentMetrics && recentMetrics.length > 0) {
              businessContext += `\nRecent Workflow Metrics (Last 7 days):\n`;
              businessContext += recentMetrics.map(m => 
                `- ${m.workflow_name}: ${m.status} (${new Date(m.executed_at).toLocaleDateString()})`
              ).join("\n");
              contextInjected.push("recent_metrics");
            }
          }

          // Inject related incidents if requested
          if (hints.includes("related_incidents") || hints.includes("system_logs")) {
            const { data: incidents } = await supabase
              .from("anomaly_detections")
              .select("anomaly_type, description, severity, created_at")
              .eq("customer_id", customerId)
              .eq("status", "new")
              .order("created_at", { ascending: false })
              .limit(5);

            if (incidents && incidents.length > 0) {
              businessContext += `\n\nRecent System Incidents:\n`;
              businessContext += incidents.map(i => 
                `- [${i.severity.toUpperCase()}] ${i.anomaly_type}: ${i.description}`
              ).join("\n");
              contextInjected.push("related_incidents");
            }
          }

          // Inject recent changes if requested
          if (hints.includes("recent_changes")) {
            const { data: changes } = await supabase
              .from("change_requests")
              .select("title, change_status, created_at")
              .eq("customer_id", customerId)
              .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
              .order("created_at", { ascending: false })
              .limit(10);

            if (changes && changes.length > 0) {
              businessContext += `\n\nRecent Changes (Last 30 days):\n`;
              businessContext += changes.map(c => 
                `- ${c.title}: ${c.change_status} (${new Date(c.created_at).toLocaleDateString()})`
              ).join("\n");
              contextInjected.push("recent_changes");
            }
          }

          // Inject compliance requirements if requested
          if (hints.includes("compliance_requirements")) {
            const { data: frameworks } = await supabase
              .from("compliance_frameworks")
              .select("framework_name, overall_compliance_percentage")
              .eq("customer_id", customerId)
              .eq("is_active", true)
              .order("overall_compliance_percentage", { ascending: true })
              .limit(5);

            if (frameworks && frameworks.length > 0) {
              businessContext += `\n\nCompliance Status:\n`;
              businessContext += frameworks.map(f => 
                `- ${f.framework_name}: ${f.overall_compliance_percentage}% compliant`
              ).join("\n");
              contextInjected.push("compliance_requirements");
            }
          }

          // Inject department goals if requested
          if (hints.includes("department_goals")) {
            const { data: insights } = await supabase
              .from("department_insights")
              .select("title, insight_type, confidence_score")
              .eq("customer_id", customerId)
              .eq("department", department)
              .eq("status", "active")
              .order("confidence_score", { ascending: false })
              .limit(5);

            if (insights && insights.length > 0) {
              businessContext += `\n\nDepartment Insights:\n`;
              businessContext += insights.map(i => 
                `- ${i.title} (${i.insight_type}, confidence: ${Math.round((i.confidence_score || 0) * 100)}%)`
              ).join("\n");
              contextInjected.push("department_goals");
            }
          }

          if (contextInjected.length > 0) {
            enhancedQuery = query + businessContext;
            console.log(`Context injected: ${contextInjected.join(", ")}`);
          }
        }

        // Track template usage
        await supabase.from("prompt_usage").insert({
          customer_id: customerId,
          user_id: userId,
          template_id: templateId,
          prompt_text: query,
          context_injected: contextInjected.length > 0 ? { items: contextInjected } : {}
        });
      }
    }

    // Build knowledge context from articles - SANITIZE to prevent indirect injection
    let knowledgeContext = "";
    if (knowledgeArticles && knowledgeArticles.length > 0) {
      knowledgeContext = "\n\n## Available Knowledge Base:\n" + 
        knowledgeArticles.map(article => {
          const safeTitle = sanitizeIndirectContent(article.title, 100);
          const safeContent = sanitizeIndirectContent(article.content, 500);
          return `### ${safeTitle} (${article.knowledge_type})\n${safeContent}...\n`;
        }).join("\n");
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
    let baseSystemPrompt = deptConfig?.system_prompt || systemPrompts[department] || "You are a helpful AI assistant.";
    
    // SECURITY: Create secure system prompt with delimiters and anti-injection rules
    let systemPrompt = createSecureSystemPrompt(baseSystemPrompt, knowledgeContext);

    // PHASE 4: Add global insights and feedback to system prompt
    if (globalFeedback && globalFeedback.length > 0) {
      systemPrompt += "\n\n=== ORGANIZATION-WIDE INSIGHTS & RECOMMENDATIONS ===\n";
      systemPrompt += "The following insights have been identified across multiple departments:\n\n";
      
      for (const feedback of globalFeedback) {
        const insight = feedback.global_insights as any;
        systemPrompt += `📊 ${feedback.feedback_type.toUpperCase()}: ${feedback.feedback_content}\n`;
        if (insight) {
          systemPrompt += `   Related Pattern: ${insight.title}\n`;
          systemPrompt += `   Confidence: ${Math.round((insight.confidence_score || 0) * 100)}%\n`;
          const actions = insight.recommended_actions;
          if (actions && Array.isArray(actions) && actions.length > 0) {
            systemPrompt += `   Recommended Actions:\n`;
            for (const action of actions) {
              systemPrompt += `   - ${action}\n`;
            }
          }
        }
        systemPrompt += `   Priority: ${feedback.priority.toUpperCase()}\n\n`;
      }
      
      systemPrompt += "When relevant to the user's query, proactively mention these insights and recommendations.\n";
    }

    // Build messages array using enhanced query with delimiters
    const userQueryWithDelimiters = addInputDelimiters(enhancedQuery);
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userQueryWithDelimiters }
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

    // SECURITY: Validate tool calls if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        const validation = validateToolCall(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments || '{}'),
          userId,
          customerId
        );
        
        if (!validation.isValid) {
          console.error(`Tool call validation failed: ${validation.error}`);
          
          // Log security event
          await logSecurityEvent(
            supabase,
            createToolCallValidationLog(
              'department-assistant',
              userId,
              customerId,
              toolCall.function.name,
              validation.error || 'Unknown validation error',
              JSON.parse(toolCall.function.arguments || '{}')
            )
          );
          
          return new Response(
            JSON.stringify({ 
              error: 'Invalid tool parameters detected',
              details: validation.error
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // SECURITY: Filter output to prevent data exfiltration
    let responseContent = assistantMessage.content || '';
    responseContent = filterOutput(responseContent);

    // Store conversation history
    let conversationIds: string[] = [];
    try {
      const { data: insertedConvs } = await supabase.from("conversation_history").insert([
        {
          customer_id: customerId,
          user_id: userId,
          department,
          conversation_id: userId, // Could be enhanced with proper conversation tracking
          role: "user",
          content: query,
        },
        {
          customer_id: customerId,
          user_id: userId,
          department,
          conversation_id: userId,
          role: "assistant",
          content: responseContent, // Use filtered content
          tool_calls: assistantMessage.tool_calls,
        },
      ]).select('id');
      
      if (insertedConvs) {
        conversationIds = insertedConvs.map(c => c.id);
      }
    } catch (err) {
      console.error("Failed to store conversation history:", err);
    }

    // Phase 2: Insight Generation
    // Check for patterns and generate insights after storing conversation
    try {
      await generateInsightsIfNeeded(supabase, customerId, department, userId, query, assistantMessage.content, conversationIds);
    } catch (err) {
      console.error("Failed to generate insights:", err);
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
          response: responseContent || `I've analyzed your request using ${toolName}. Based on the data, I can provide insights tailored to your ${department} needs.`,
          toolCalled: toolName,
          toolArgs,
          contextInjected,
          conversationHistory: [
            ...conversationHistory,
            { role: "user", content: query },
            { role: "assistant", content: responseContent || "Analysis complete." }
          ]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return regular response with context info
    return new Response(
      JSON.stringify({
        response: responseContent,
        contextInjected,
        conversationHistory: [
          ...conversationHistory,
          { role: "user", content: query },
          { role: "assistant", content: responseContent }
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
