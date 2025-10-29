/**
 * Workflow Service
 * Manages workflows, executions, and triggers
 */

import { supabase } from "@/integrations/supabase/client";

export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  order: number;
}

export interface Workflow {
  id: string;
  workflow_name: string;
  description?: string;
  steps: WorkflowStep[];
  systems_involved?: string[];
  workflow_type?: string;
  is_active: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  triggered_by: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  execution_log: any[];
  workflows: {
    workflow_name: string;
  };
}

export interface WorkflowTrigger {
  id: string;
  workflow_id: string;
  trigger_type: string;
  trigger_config: any;
  webhook_url: string | null;
  is_enabled: boolean;
  last_triggered_at: string | null;
  workflows: {
    workflow_name: string;
  };
}

export class WorkflowService {
  /**
   * Get active workflows by customer
   */
  static async getActiveWorkflows(customerId: string) {
    const { data, error } = await supabase
      .from('workflows')
      .select('id, workflow_name')
      .eq('customer_id', customerId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Create new workflow
   */
  static async createWorkflow(
    customerId: string,
    workflowData: {
      workflow_name: string;
      description?: string;
      steps: WorkflowStep[];
      workflow_type?: string;
    }
  ) {
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        customer_id: customerId,
        workflow_name: workflowData.workflow_name,
        description: workflowData.description || null,
        steps: workflowData.steps as any,
        systems_involved: [...new Set(workflowData.steps.map(s => s.type))],
        workflow_type: workflowData.workflow_type || 'manual',
        is_active: true
      })
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to create workflow');
    return data;
  }

  /**
   * Get workflow executions
   */
  static async getExecutions(customerId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflows(workflow_name)
      `)
      .eq('customer_id', customerId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as WorkflowExecution[];
  }

  /**
   * Get workflow triggers
   */
  static async getTriggers(customerId: string) {
    const { data, error } = await supabase
      .from('workflow_triggers')
      .select(`
        *,
        workflows(workflow_name)
      `)
      .eq('customer_id', customerId);

    if (error) throw error;
    return (data || []) as WorkflowTrigger[];
  }

  /**
   * Create webhook trigger
   */
  static async createWebhookTrigger(workflowId: string, customerId: string) {
    const { data, error } = await supabase
      .from('workflow_triggers')
      .insert({
        workflow_id: workflowId,
        customer_id: customerId,
        trigger_type: 'webhook',
        trigger_config: {},
        is_enabled: true
      })
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to create trigger');

    // Generate unique webhook URL
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workflow-webhook?id=${data.id}`;
    
    // Update trigger with webhook URL
    await supabase
      .from('workflow_triggers')
      .update({ webhook_url: webhookUrl })
      .eq('id', data.id);

    return data;
  }

  /**
   * Create trigger with any configuration
   */
  static async createTrigger(
    workflowId: string,
    customerId: string,
    triggerData: {
      trigger_type: string;
      trigger_config: any;
      is_enabled?: boolean;
    }
  ) {
    const { data, error } = await supabase
      .from('workflow_triggers')
      .insert({
        workflow_id: workflowId,
        customer_id: customerId,
        ...triggerData
      })
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to create trigger');
    return data;
  }

  /**
   * Toggle trigger enabled state
   */
  static async toggleTrigger(triggerId: string, isEnabled: boolean) {
    const { error } = await supabase
      .from('workflow_triggers')
      .update({ is_enabled: !isEnabled })
      .eq('id', triggerId);

    if (error) throw error;
  }
}
