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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { workflow_id, trigger_data, triggered_by = 'manual' } = await req.json();

    if (!workflow_id) {
      return new Response(
        JSON.stringify({ error: 'workflow_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Executing workflow ${workflow_id}, triggered by: ${triggered_by}`);

    // Fetch workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflow_id)
      .single();

    if (workflowError || !workflow) {
      return new Response(
        JSON.stringify({ error: 'Workflow not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!workflow.is_active) {
      return new Response(
        JSON.stringify({ error: 'Workflow is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflow_id,
        customer_id: workflow.customer_id,
        triggered_by: triggered_by,
        trigger_data: trigger_data,
        status: 'running'
      })
      .select()
      .single();

    if (executionError) {
      console.error('Failed to create execution record:', executionError);
      return new Response(
        JSON.stringify({ error: 'Failed to start execution' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute workflow steps
    const executionLog: any[] = [];
    const steps = workflow.steps as any[];

    try {
      for (const step of steps) {
        console.log(`Executing step: ${step.name} (${step.type})`);
        
        const stepStartTime = Date.now();
        let stepResult: any = {};

        switch (step.type) {
          case 'api_call':
            stepResult = await executeApiCall(step.config);
            break;
          case 'data_transform':
            stepResult = await executeDataTransform(step.config, trigger_data);
            break;
          case 'condition':
            stepResult = await evaluateCondition(step.config, trigger_data);
            break;
          case 'notification':
            stepResult = await sendNotification(step.config, workflow.customer_id);
            break;
          case 'database_operation':
            stepResult = await executeDatabaseOperation(step.config, supabase);
            break;
          case 'delay':
            stepResult = await executeDelay(step.config);
            break;
          default:
            stepResult = { success: true, message: `Skipped unknown step type: ${step.type}` };
        }

        executionLog.push({
          step_id: step.id,
          step_name: step.name,
          step_type: step.type,
          duration_ms: Date.now() - stepStartTime,
          result: stepResult,
          timestamp: new Date().toISOString()
        });

        // If step failed and no error handling is defined, stop execution
        if (!stepResult.success) {
          throw new Error(`Step "${step.name}" failed: ${stepResult.error || 'Unknown error'}`);
        }
      }

      // Mark execution as completed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_log: executionLog
        })
        .eq('id', execution.id);

      console.log(`Workflow ${workflow_id} completed successfully`);

      return new Response(
        JSON.stringify({
          success: true,
          execution_id: execution.id,
          message: 'Workflow completed successfully',
          execution_log: executionLog
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      console.error('Workflow execution error:', error);

      // Mark execution as failed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          execution_log: executionLog
        })
        .eq('id', execution.id);

      return new Response(
        JSON.stringify({
          success: false,
          execution_id: execution.id,
          error: error.message,
          execution_log: executionLog
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Step execution functions
async function executeApiCall(config: any) {
  try {
    const { url, method = 'GET', headers = {}, body } = config;
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      data,
      status: response.status
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function executeDataTransform(config: any, inputData: any) {
  try {
    // Simple data transformation using mapping config
    const { mapping } = config;
    const result: any = {};

    if (mapping) {
      for (const [key, path] of Object.entries(mapping)) {
        result[key] = getNestedValue(inputData, path as string);
      }
    }

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function evaluateCondition(config: any, data: any) {
  try {
    const { field, operator, value } = config;
    const fieldValue = getNestedValue(data, field);

    let result = false;

    switch (operator) {
      case 'equals':
        result = fieldValue === value;
        break;
      case 'not_equals':
        result = fieldValue !== value;
        break;
      case 'greater_than':
        result = fieldValue > value;
        break;
      case 'less_than':
        result = fieldValue < value;
        break;
      case 'contains':
        result = String(fieldValue).includes(value);
        break;
      default:
        result = false;
    }

    return {
      success: true,
      condition_met: result,
      field_value: fieldValue
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function sendNotification(config: any, customer_id: string) {
  try {
    // This would integrate with your notification system
    console.log('Sending notification:', config);
    
    return {
      success: true,
      message: 'Notification sent'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function executeDatabaseOperation(config: any, supabase: any) {
  try {
    const { table, operation, data, filters } = config;

    let query = supabase.from(table);

    switch (operation) {
      case 'insert':
        query = query.insert(data);
        break;
      case 'update':
        query = query.update(data);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        break;
      case 'delete':
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        query = query.delete();
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    const { data: result, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function executeDelay(config: any) {
  const { duration_ms = 1000 } = config;
  await new Promise(resolve => setTimeout(resolve, duration_ms));
  
  return {
    success: true,
    message: `Delayed for ${duration_ms}ms`
  };
}

function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
