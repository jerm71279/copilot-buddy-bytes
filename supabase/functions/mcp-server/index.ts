import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tool_name, server_id, customer_id, user_id, input_data } = await req.json();

    if (!tool_name || !server_id || !customer_id) {
      throw new Error('Missing required parameters: tool_name, server_id, customer_id');
    }

    const startTime = Date.now();
    let output_data: any = null;
    let status = 'success';
    let error_message = null;

    try {
      // Execute MCP tool based on tool_name
      switch (tool_name) {
        case 'query_compliance_status':
          output_data = await queryComplianceStatus(supabaseClient, customer_id, input_data);
          break;
        
        case 'predict_violations':
          output_data = await predictViolations(supabaseClient, customer_id, input_data);
          break;
        
        case 'analyze_control_gaps':
          output_data = await analyzeControlGaps(supabaseClient, customer_id, input_data);
          break;
        
        case 'generate_evidence_report':
          output_data = await generateEvidenceReport(supabaseClient, customer_id, input_data);
          break;
        
        case 'analyze_workflow_efficiency':
          output_data = await analyzeWorkflowEfficiency(supabaseClient, customer_id, input_data);
          break;
        
        case 'detect_bottlenecks':
          output_data = await detectBottlenecks(supabaseClient, customer_id, input_data);
          break;
        
        case 'predict_completion_times':
          output_data = await predictCompletionTimes(supabaseClient, customer_id, input_data);
          break;
        
        case 'recommend_optimizations':
          output_data = await recommendOptimizations(supabaseClient, customer_id, input_data);
          break;
        
        default:
          throw new Error(`Unknown tool: ${tool_name}`);
      }
    } catch (error) {
      status = 'error';
      error_message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error executing ${tool_name}:`, error);
    }

    const execution_time_ms = Date.now() - startTime;

    // Log execution
    await supabaseClient.from('mcp_execution_logs').insert({
      server_id,
      customer_id,
      user_id,
      tool_name,
      input_data,
      output_data,
      status,
      execution_time_ms,
      error_message,
    });

    // Update tool statistics (optional, ignore errors)
    try {
      await supabaseClient.rpc('increment_tool_execution', {
        tool_name_param: tool_name,
        server_id_param: server_id,
        exec_time: execution_time_ms,
      });
    } catch (rpcError) {
      console.log('Could not update tool statistics:', rpcError);
    }

    return new Response(
      JSON.stringify({ 
        success: status === 'success',
        data: output_data,
        execution_time_ms,
        error: error_message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MCP Server Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// MCP Tool Implementations

async function queryComplianceStatus(supabase: any, customer_id: string, input: any) {
  const { framework_code, control_id, time_range } = input;

  // Query compliance reports
  const { data: reports, error } = await supabase
    .from('compliance_reports')
    .select('*')
    .eq('customer_id', customer_id)
    .order('generated_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  // Calculate compliance score
  const compliance_score = reports?.length > 0 ? 
    reports[0].findings?.compliance_percentage || 0 : 0;

  // Count active controls
  const { count: active_controls } = await supabase
    .from('compliance_controls')
    .select('*', { count: 'exact', head: true });

  return {
    compliance_score,
    active_controls: active_controls || 0,
    violations: reports?.[0]?.findings?.violations || [],
    trend: compliance_score > 85 ? 'improving' : 'needs_attention',
    last_assessment: reports?.[0]?.generated_at,
  };
}

async function predictViolations(supabase: any, customer_id: string, input: any) {
  const { user_id, system_name, lookback_days = 30 } = input;

  // Analyze behavioral events
  const { data: events } = await supabase
    .from('behavioral_events')
    .select('*')
    .eq('customer_id', customer_id)
    .gte('timestamp', new Date(Date.now() - lookback_days * 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false });

  // Simple risk scoring based on failed events
  const failed_events = events?.filter((e: any) => !e.success) || [];
  const risk_score = Math.min((failed_events.length / (events?.length || 1)) * 100, 100);

  return {
    risk_score,
    predicted_violations: failed_events.slice(0, 5).map((e: any) => ({
      system: e.system_name,
      action: e.action,
      timestamp: e.timestamp,
    })),
    recommendations: [
      'Implement additional access controls',
      'Review user permissions',
      'Enable multi-factor authentication',
    ],
    confidence: 0.75,
  };
}

async function analyzeControlGaps(supabase: any, customer_id: string, input: any) {
  const { framework_id, include_recommendations = true } = input;

  // Get all controls for framework
  const { data: controls } = await supabase
    .from('compliance_controls')
    .select('*')
    .eq('framework_id', framework_id);

  const manual_controls = controls?.filter((c: any) => c.automation_level === 'manual') || [];

  return {
    gaps: manual_controls.map((c: any) => ({
      control_id: c.control_id,
      control_name: c.control_name,
      automation_level: c.automation_level,
      category: c.category,
    })),
    missing_controls: [],
    recommendations: include_recommendations ? [
      'Automate evidence collection for manual controls',
      'Implement continuous monitoring',
      'Set up automated alerting',
    ] : [],
    priority_score: manual_controls.length > 10 ? 85 : 50,
  };
}

async function generateEvidenceReport(supabase: any, customer_id: string, input: any) {
  const { framework_code, start_date, end_date, control_ids } = input;

  // Get evidence files
  const query = supabase
    .from('evidence_files')
    .select('*')
    .eq('customer_id', customer_id)
    .gte('uploaded_at', start_date)
    .lte('uploaded_at', end_date);

  const { data: evidence, count } = await query;

  // Get audit logs for the period
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('customer_id', customer_id)
    .gte('timestamp', start_date)
    .lte('timestamp', end_date);

  return {
    report_id: crypto.randomUUID(),
    total_evidence: count || 0,
    coverage_percentage: Math.min(((count || 0) / 50) * 100, 100),
    findings: {
      evidence_collected: count || 0,
      audit_events: logs?.length || 0,
      compliance_status: 'in_progress',
    },
    download_url: '/api/reports/download',
  };
}

async function analyzeWorkflowEfficiency(supabase: any, customer_id: string, input: any) {
  const { workflow_id, time_period = '7d', include_ml_predictions = true } = input;

  let query = supabase
    .from('workflows')
    .select('*')
    .eq('customer_id', customer_id);

  if (workflow_id) {
    query = query.eq('id', workflow_id);
  }

  const { data: workflows } = await query;

  const workflow = workflows?.[0];
  if (!workflow) throw new Error('Workflow not found');

  const efficiency_score = workflow.successful_executions / (workflow.total_executions || 1) * 100;

  return {
    efficiency_score: Math.round(efficiency_score),
    avg_completion_time: workflow.avg_completion_time || 0,
    success_rate: efficiency_score / 100,
    bottlenecks: [],
    predictions: include_ml_predictions ? {
      next_execution_time: workflow.avg_completion_time,
      confidence: 0.8,
    } : null,
  };
}

async function detectBottlenecks(supabase: any, customer_id: string, input: any) {
  const { system_names = [], threshold_ms = 5000, min_occurrences = 5 } = input;

  // Analyze behavioral events for slow operations
  let query = supabase
    .from('behavioral_events')
    .select('*')
    .eq('customer_id', customer_id)
    .gte('duration_ms', threshold_ms)
    .order('duration_ms', { ascending: false })
    .limit(100);

  if (system_names.length > 0) {
    query = query.in('system_name', system_names);
  }

  const { data: slow_events } = await query;

  // Group by system and action
  const bottlenecks = slow_events?.reduce((acc: any[], event: any) => {
    const key = `${event.system_name}:${event.action}`;
    const existing = acc.find(b => b.key === key);
    
    if (existing) {
      existing.occurrences++;
      existing.total_time += event.duration_ms;
    } else {
      acc.push({
        key,
        system: event.system_name,
        action: event.action,
        occurrences: 1,
        total_time: event.duration_ms,
        avg_time: event.duration_ms,
      });
    }
    return acc;
  }, []).filter((b: any) => b.occurrences >= min_occurrences) || [];

  bottlenecks.forEach((b: any) => {
    b.avg_time = Math.round(b.total_time / b.occurrences);
  });

  return {
    bottlenecks: bottlenecks.slice(0, 10),
    affected_workflows: [],
    estimated_impact: {
      time_saved_potential: bottlenecks.reduce((sum: number, b: any) => sum + (b.avg_time * 0.3), 0),
      affected_users: new Set(slow_events?.map((e: any) => e.user_id)).size,
    },
    recommendations: [
      'Optimize database queries',
      'Implement caching layer',
      'Review system integrations',
    ],
  };
}

async function predictCompletionTimes(supabase: any, customer_id: string, input: any) {
  const { workflow_name, systems_involved, current_step } = input;

  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('workflow_name', workflow_name)
    .single();

  if (!workflow) throw new Error('Workflow not found');

  const predicted_time = workflow.avg_completion_time || 30000;
  const variance = predicted_time * 0.2;

  return {
    predicted_time_ms: predicted_time,
    confidence_interval: {
      lower: Math.round(predicted_time - variance),
      upper: Math.round(predicted_time + variance),
    },
    factors: [
      'Historical execution time',
      'System load',
      'Time of day',
    ],
    similar_executions: workflow.total_executions || 0,
  };
}

async function recommendOptimizations(supabase: any, customer_id: string, input: any) {
  const { workflow_id, optimization_goals = ['speed'], max_recommendations = 5 } = input;

  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('id', workflow_id)
    .single();

  if (!workflow) throw new Error('Workflow not found');

  const success_rate = workflow.successful_executions / (workflow.total_executions || 1);

  const recommendations = [
    {
      title: 'Implement parallel processing',
      description: 'Process independent steps concurrently to reduce execution time',
      impact: 'high',
      effort: 'medium',
      expected_improvement: '30-40% faster',
    },
    {
      title: 'Add caching layer',
      description: 'Cache frequently accessed data to reduce system calls',
      impact: 'medium',
      effort: 'low',
      expected_improvement: '15-20% faster',
    },
    {
      title: 'Optimize system integrations',
      description: 'Use batch APIs where available to reduce network overhead',
      impact: 'medium',
      effort: 'medium',
      expected_improvement: '20-25% faster',
    },
  ].slice(0, max_recommendations);

  return {
    recommendations,
    expected_improvement: {
      time_reduction: '30-50%',
      reliability_increase: success_rate < 0.9 ? '10-15%' : 'minimal',
    },
    implementation_effort: 'medium',
    priority_order: recommendations.map(r => r.title),
  };
}