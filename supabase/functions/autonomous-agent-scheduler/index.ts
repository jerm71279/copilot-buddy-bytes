import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Autonomous Agent Scheduler
 * Runs scheduled tasks for all department agents
 * Can be triggered by cron or manually
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("🤖 Autonomous Agent Scheduler starting...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active tasks that are due for execution
    const { data: dueTasks, error: tasksError } = await supabase
      .from("ai_agent_tasks")
      .select("*")
      .eq("is_active", true)
      .lte("next_execution_at", new Date().toISOString())
      .order("priority", { ascending: false })
      .limit(50);

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    console.log(`📋 Found ${dueTasks?.length || 0} tasks due for execution`);

    const results = [];

    for (const task of dueTasks || []) {
      const taskStart = Date.now();
      console.log(`⚡ Executing task: ${task.task_name} (${task.task_type}) for ${task.department}`);

      try {
        let taskResult;

        switch (task.task_type) {
          case "monitor":
            taskResult = await executeMonitorTask(supabase, task);
            break;
          case "alert":
            taskResult = await executeAlertTask(supabase, task);
            break;
          case "analyze":
            taskResult = await executeAnalyzeTask(supabase, task);
            break;
          case "optimize":
            taskResult = await executeOptimizeTask(supabase, task);
            break;
          case "report":
            taskResult = await executeReportTask(supabase, task);
            break;
          case "coordinate":
            taskResult = await executeCoordinateTask(supabase, task);
            break;
          default:
            taskResult = { status: "skipped", message: "Unknown task type" };
        }

        const executionTime = Date.now() - taskStart;

        // Record successful execution
        await supabase.from("ai_agent_task_executions").insert({
          task_id: task.id,
          customer_id: task.customer_id,
          department: task.department,
          status: "success",
          execution_time_ms: executionTime,
          results: taskResult,
          actions_taken: (taskResult as any).actions || [],
          metrics_captured: (taskResult as any).metrics || {}
        });

        // Update task statistics and next execution time
        const nextExecution = calculateNextExecution(task.schedule_cron);
        await supabase
          .from("ai_agent_tasks")
          .update({
            last_executed_at: new Date().toISOString(),
            next_execution_at: nextExecution,
            execution_count: task.execution_count + 1,
            success_count: task.success_count + 1,
            avg_execution_time_ms: Math.round(
              ((task.avg_execution_time_ms || 0) * task.execution_count + executionTime) /
              (task.execution_count + 1)
            )
          })
          .eq("id", task.id);

        results.push({
          task_id: task.id,
          task_name: task.task_name,
          status: "success",
          execution_time_ms: executionTime
        });

        console.log(`✅ Task completed: ${task.task_name} (${executionTime}ms)`);

      } catch (error) {
        console.error(`❌ Task failed: ${task.task_name}`, error);

        // Record failed execution
        await supabase.from("ai_agent_task_executions").insert({
          task_id: task.id,
          customer_id: task.customer_id,
          department: task.department,
          status: "failure",
          execution_time_ms: Date.now() - taskStart,
          error_message: error instanceof Error ? error.message : String(error)
        });

        // Update failure statistics
        await supabase
          .from("ai_agent_tasks")
          .update({
            failure_count: task.failure_count + 1,
            execution_count: task.execution_count + 1
          })
          .eq("id", task.id);

        results.push({
          task_id: task.id,
          task_name: task.task_name,
          status: "failure",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🏁 Scheduler completed in ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        tasks_executed: results.length,
        total_time_ms: totalTime,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scheduler error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Task Execution Functions

async function executeMonitorTask(supabase: any, task: any) {
  const config = task.task_config;
  const actions = [];
  const metrics: any = {};

  // Monitor based on config
  if (config.monitor_type === "anomaly_detection") {
    const { data: anomalies } = await supabase
      .from("anomaly_detections")
      .select("*")
      .eq("customer_id", task.customer_id)
      .eq("status", "new")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    metrics.anomaly_count = anomalies?.length || 0;

    if (anomalies && anomalies.length > config.threshold) {
      await supabase.from("ai_agent_alerts").insert({
        customer_id: task.customer_id,
        department: task.department,
        alert_type: "threshold",
        severity: "warning",
        title: `Anomaly spike detected in ${task.department}`,
        description: `${anomalies.length} new anomalies detected in the last hour`,
        detected_by_task_id: task.id,
        supporting_data: { anomalies: anomalies.slice(0, 5) },
        recommended_actions: ["Review anomalies", "Check system health"]
      });
      actions.push("created_alert");
    }
  }

  if (config.monitor_type === "workflow_performance") {
    const { data: workflows } = await supabase
      .from("workflow_executions")
      .select("*")
      .eq("customer_id", task.customer_id)
      .eq("status", "failed")
      .gte("executed_at", new Date(Date.now() - 86400000).toISOString());

    metrics.failed_workflows = workflows?.length || 0;

    if (workflows && workflows.length > config.threshold) {
      await supabase.from("ai_agent_alerts").insert({
        customer_id: task.customer_id,
        department: task.department,
        alert_type: "threshold",
        severity: "critical",
        title: `Workflow failure rate increased`,
        description: `${workflows.length} workflow failures in the last 24 hours`,
        detected_by_task_id: task.id,
        supporting_data: { workflows: workflows.slice(0, 5) },
        recommended_actions: ["Investigate failed workflows", "Check error patterns"]
      });
      actions.push("created_alert");
    }
  }

  return { actions, metrics, message: "Monitoring completed" };
}

async function executeAlertTask(supabase: any, task: any) {
  const config = task.task_config;
  const actions = [];

  // Check specific conditions and create alerts
  if (config.alert_condition === "compliance_score_drop") {
    const { data: frameworks } = await supabase
      .from("compliance_frameworks")
      .select("*")
      .eq("customer_id", task.customer_id)
      .lt("overall_compliance_percentage", config.threshold || 80);

    if (frameworks && frameworks.length > 0) {
      for (const framework of frameworks) {
        await supabase.from("ai_agent_alerts").insert({
          customer_id: task.customer_id,
          department: task.department,
          alert_type: "threshold",
          severity: "critical",
          title: `Compliance score below threshold`,
          description: `${framework.framework_name} compliance: ${framework.overall_compliance_percentage}%`,
          detected_by_task_id: task.id,
          supporting_data: { framework },
          recommended_actions: ["Review failed controls", "Update evidence"]
        });
        actions.push(`alert_created_${framework.framework_name}`);
      }
    }
  }

  return { actions, message: "Alert checks completed" };
}

async function executeAnalyzeTask(supabase: any, task: any) {
  const config = task.task_config;
  const actions = [];
  const metrics: any = {};

  // Analyze patterns and trends
  if (config.analysis_type === "user_behavior") {
    const { data: events } = await supabase
      .from("behavioral_events")
      .select("*")
      .eq("customer_id", task.customer_id)
      .gte("timestamp", new Date(Date.now() - 604800000).toISOString())
      .limit(1000);

    metrics.events_analyzed = events?.length || 0;

    // Store analysis in agent memory
    await supabase.from("ai_agent_memory").insert({
      customer_id: task.customer_id,
      department: task.department,
      memory_type: "observation",
      memory_key: "weekly_behavior_analysis",
      memory_value: {
        event_count: events?.length || 0,
        analyzed_at: new Date().toISOString()
      },
      importance_score: 6
    });

    actions.push("stored_analysis");
  }

  return { actions, metrics, message: "Analysis completed" };
}

async function executeOptimizeTask(supabase: any, task: any) {
  const config = task.task_config;
  const actions = [];

  // Run optimization logic
  if (config.optimize_target === "workflow_efficiency") {
    // Identify slow workflows
    const { data: slowWorkflows } = await supabase
      .from("workflow_executions")
      .select("workflow_name, execution_time_ms")
      .eq("customer_id", task.customer_id)
      .gt("execution_time_ms", config.threshold || 10000)
      .gte("executed_at", new Date(Date.now() - 604800000).toISOString());

    if (slowWorkflows && slowWorkflows.length > 0) {
      await supabase.from("ai_agent_learning").insert({
        customer_id: task.customer_id,
        department: task.department,
        learning_type: "optimization",
        learned_from: "workflow_analysis",
        lesson: {
          slow_workflows: slowWorkflows,
          recommendation: "Consider breaking down complex workflows"
        },
        confidence_score: 0.75
      });
      actions.push("created_optimization_recommendation");
    }
  }

  return { actions, message: "Optimization completed" };
}

async function executeReportTask(supabase: any, task: any) {
  const config = task.task_config;
  const actions = [];

  // Generate periodic reports
  if (config.report_type === "department_summary") {
    // Generate summary and store in memory
    await supabase.from("ai_agent_memory").insert({
      customer_id: task.customer_id,
      department: task.department,
      memory_type: "context",
      memory_key: "daily_summary",
      memory_value: {
        generated_at: new Date().toISOString(),
        summary: "Daily operations summary"
      },
      importance_score: 7,
      expires_at: new Date(Date.now() + 604800000).toISOString() // 7 days
    });
    actions.push("generated_report");
  }

  return { actions, message: "Report generated" };
}

async function executeCoordinateTask(supabase: any, task: any) {
  const config = task.task_config;
  const actions = [];

  // Cross-department coordination
  if (config.coordinate_with) {
    for (const targetDept of config.coordinate_with) {
      await supabase.from("agent_coordination_messages").insert({
        customer_id: task.customer_id,
        from_department: task.department,
        to_department: targetDept,
        message_type: "notification",
        subject: config.subject || "Status update",
        content: config.message || { type: "periodic_sync" },
        priority: config.priority || 5
      });
      actions.push(`coordinated_with_${targetDept}`);
    }
  }

  return { actions, message: "Coordination completed" };
}

function calculateNextExecution(cronExpression?: string): string | null {
  if (!cronExpression) return null;

  // Simple cron parser for common patterns
  // Format: minute hour day month dayOfWeek
  // * * * * * = every minute
  // 0 * * * * = every hour
  // 0 0 * * * = every day at midnight

  const parts = cronExpression.split(" ");
  if (parts.length !== 5) return null;

  const now = new Date();
  const nextExec = new Date(now);

  // Handle simple cases
  if (cronExpression === "* * * * *") {
    // Every minute
    nextExec.setMinutes(nextExec.getMinutes() + 1);
  } else if (cronExpression === "0 * * * *") {
    // Every hour
    nextExec.setHours(nextExec.getHours() + 1);
    nextExec.setMinutes(0);
  } else if (cronExpression === "0 0 * * *") {
    // Every day at midnight
    nextExec.setDate(nextExec.getDate() + 1);
    nextExec.setHours(0);
    nextExec.setMinutes(0);
  } else {
    // Default: 15 minutes
    nextExec.setMinutes(nextExec.getMinutes() + 15);
  }

  return nextExec.toISOString();
}