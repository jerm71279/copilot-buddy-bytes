import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Agent Coordinator
 * Handles cross-department agent communication and coordination
 * Processes messages between department agents
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate request body
    const requestData = await req.json();
    
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action field
    const action = String(requestData.action || '').slice(0, 100).trim();
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract remaining params (already destructured, now validated)
    const params = { ...requestData };

    let result;

    switch (action) {
      case "send_message":
        result = await sendCoordinationMessage(supabase, params);
        break;
      case "process_inbox":
        result = await processInbox(supabase, lovableApiKey, params);
        break;
      case "escalate":
        result = await escalateToMultipleDepartments(supabase, params);
        break;
      default:
        throw new Error("Unknown action");
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Coordinator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendCoordinationMessage(supabase: any, params: any) {
  // Validate required fields
  const customer_id = params.customer_id ? String(params.customer_id).slice(0, 100) : null;
  const from_department = String(params.from_department || '').slice(0, 100).trim();
  const to_department = String(params.to_department || '').slice(0, 100).trim();
  const message_type = String(params.message_type || '').slice(0, 50).trim();
  const subject = String(params.subject || '').slice(0, 200).trim();
  const content = params.content;
  const priority = Math.max(1, Math.min(10, Number(params.priority) || 5));

  if (!customer_id || !from_department || !to_department || !message_type || !subject) {
    throw new Error('customer_id, from_department, to_department, message_type, and subject are required');
  }

  if (!content || typeof content !== 'object') {
    throw new Error('content must be a valid object');
  }

  const { data, error } = await supabase
    .from("agent_coordination_messages")
    .insert({
      customer_id,
      from_department,
      to_department,
      message_type,
      subject,
      content,
      priority
    })
    .select()
    .maybeSingle();

  if (!data) {
    throw new Error('Failed to create coordination message');
  }

  if (error) throw error;

  return { success: true, message: data };
}

async function processInbox(supabase: any, lovableApiKey: string | undefined, params: any) {
  // Validate required fields
  const customer_id = params.customer_id ? String(params.customer_id).slice(0, 100) : null;
  const department = String(params.department || '').slice(0, 100).trim();

  if (!customer_id || !department) {
    throw new Error('customer_id and department are required');
  }

  // Get pending messages for this department
  const { data: messages, error } = await supabase
    .from("agent_coordination_messages")
    .select("*")
    .eq("customer_id", customer_id)
    .eq("to_department", department)
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .limit(10);

  if (error) throw error;

  const processed = [];

  for (const message of messages || []) {
    try {
      // Mark as processing
      await supabase
        .from("agent_coordination_messages")
        .update({ status: "processing", processed_at: new Date().toISOString() })
        .eq("id", message.id);

      let responseData;

      switch (message.message_type) {
        case "request":
          responseData = await handleRequest(supabase, lovableApiKey, message);
          break;
        case "notification":
          responseData = await handleNotification(supabase, message);
          break;
        case "escalation":
          responseData = await handleEscalation(supabase, message);
          break;
        default:
          responseData = { acknowledged: true };
      }

      // Mark as completed
      await supabase
        .from("agent_coordination_messages")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          response_data: responseData
        })
        .eq("id", message.id);

      processed.push({ message_id: message.id, status: "completed" });

    } catch (error) {
      console.error(`Failed to process message ${message.id}:`, error);

      await supabase
        .from("agent_coordination_messages")
        .update({
          status: "failed",
          response_data: { error: error instanceof Error ? error.message : String(error) }
        })
        .eq("id", message.id);

      processed.push({ message_id: message.id, status: "failed" });
    }
  }

  return { processed_count: processed.length, processed };
}

async function handleRequest(supabase: any, lovableApiKey: string | undefined, message: any) {
  const { content, customer_id, to_department } = message;

  // Handle different request types
  if (content.request_type === "data") {
    // Fetch requested data
    const { data } = await supabase
      .from(content.table)
      .select(content.fields || "*")
      .eq("customer_id", customer_id)
      .limit(content.limit || 10);

    return { data, fulfilled: true };
  }

  if (content.request_type === "analysis") {
    // Perform analysis using AI if available
    if (lovableApiKey) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an AI agent coordinator for the ${to_department} department. Analyze the request and provide insights.`
            },
            {
              role: "user",
              content: content.query
            }
          ]
        })
      });

      const result = await response.json();
      return {
        analysis: result.choices[0]?.message?.content,
        fulfilled: true
      };
    }
  }

  return { acknowledged: true, fulfilled: false };
}

async function handleNotification(supabase: any, message: any) {
  // Store notification in agent memory
  await supabase.from("ai_agent_memory").insert({
    customer_id: message.customer_id,
    department: message.to_department,
    memory_type: "context",
    memory_key: `notification_${message.id}`,
    memory_value: {
      from: message.from_department,
      subject: message.subject,
      content: message.content,
      received_at: new Date().toISOString()
    },
    importance_score: message.priority,
    expires_at: new Date(Date.now() + 2592000000).toISOString() // 30 days
  });

  return { acknowledged: true };
}

async function handleEscalation(supabase: any, message: any) {
  // Create high-priority alert for the department
  await supabase.from("ai_agent_alerts").insert({
    customer_id: message.customer_id,
    department: message.to_department,
    alert_type: "urgent",
    severity: "critical",
    title: `Escalation from ${message.from_department}: ${message.subject}`,
    description: JSON.stringify(message.content),
    supporting_data: message.content,
    recommended_actions: message.content.recommended_actions || []
  });

  return { escalated: true, alert_created: true };
}

async function escalateToMultipleDepartments(supabase: any, params: any) {
  // Validate required fields
  const customer_id = params.customer_id ? String(params.customer_id).slice(0, 100) : null;
  const from_department = String(params.from_department || '').slice(0, 100).trim();
  const target_departments = Array.isArray(params.target_departments) 
    ? params.target_departments.slice(0, 20).map((d: any) => String(d).slice(0, 100).trim())
    : [];
  const subject = String(params.subject || '').slice(0, 200).trim();
  const content = params.content;
  const priority = Math.max(1, Math.min(10, Number(params.priority) || 9));

  if (!customer_id || !from_department || target_departments.length === 0 || !subject) {
    throw new Error('customer_id, from_department, target_departments, and subject are required');
  }

  if (!content || typeof content !== 'object') {
    throw new Error('content must be a valid object');
  }

  const messages = [];

  for (const dept of target_departments) {
    const { data } = await supabase
      .from("agent_coordination_messages")
      .insert({
        customer_id,
        from_department,
        to_department: dept,
        message_type: "escalation",
        subject,
        content,
        priority
      })
      .select()
      .maybeSingle();

    if (data) messages.push(data);
  }

  return { escalated_to: target_departments.length, messages };
}