/**
 * Workflow Service
 * Manages workflows, executions, and triggers
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { BaseService, ServiceResponse } from "./baseService";

export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
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
  execution_log: unknown[];
  workflows: {
    workflow_name: string;
  };
}

export interface WorkflowTrigger {
  id: string;
  workflow_id: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  webhook_url: string | null;
  is_enabled: boolean;
  last_triggered_at: string | null;
  workflows: {
    workflow_name: string;
  };
}

export class WorkflowService extends BaseService {
  /**
   * Get active workflows by customer ID
   * @param customerId - The customer's unique identifier
   * @returns Array of active workflows with id and name
   * @throws Error if database query fails
   */
  static async getActiveWorkflows(customerId: string): Promise<ServiceResponse<Array<{ id: string; workflow_name: string }>>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('workflows')
        .select('id, workflow_name')
        .eq('customer_id', customerId)
        .eq('is_active', true);
    });
  }

  /**
   * Create new workflow
   * @param customerId - The customer's unique identifier
   * @param workflowData - Workflow configuration data
   * @returns The created workflow object
   * @throws Error if workflow creation fails
   */
  static async createWorkflow(
    customerId: string,
    workflowData: {
      workflow_name: string;
      description?: string;
      steps: WorkflowStep[];
      workflow_type?: string;
    }
  ): Promise<ServiceResponse<Workflow>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('workflows')
        .insert({
          customer_id: customerId,
          workflow_name: workflowData.workflow_name,
          description: workflowData.description || null,
          steps: workflowData.steps as unknown as Database['public']['Tables']['workflows']['Insert']['steps'],
          systems_involved: [...new Set(workflowData.steps.map(s => s.type))],
          workflow_type: workflowData.workflow_type || 'manual',
          is_active: true
        })
        .select()
        .maybeSingle();
    });
  }

  /**
   * Get workflow execution history
   * @param customerId - The customer's unique identifier
   * @param limit - Maximum number of executions to return (default: 50)
   * @returns Array of workflow executions ordered by start time
   * @throws Error if database query fails
   */
  static async getExecutions(customerId: string, limit: number = 50): Promise<ServiceResponse<WorkflowExecution[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('workflow_executions')
        .select(`
          *,
          workflows(workflow_name)
        `)
        .eq('customer_id', customerId)
        .order('started_at', { ascending: false })
        .limit(limit);
    });
  }

  /**
   * Get workflow triggers for a customer
   * @param customerId - The customer's unique identifier
   * @returns Array of workflow triggers with workflow names
   * @throws Error if database query fails
   */
  static async getTriggers(customerId: string): Promise<ServiceResponse<WorkflowTrigger[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('workflow_triggers')
        .select(`
          *,
          workflows(workflow_name)
        `)
        .eq('customer_id', customerId);
    });
  }

  /**
   * Create webhook trigger for a workflow
   * @param workflowId - The workflow's unique identifier
   * @param customerId - The customer's unique identifier
   * @returns The created trigger with webhook URL
   * @throws Error if trigger creation fails
   */
  static async createWebhookTrigger(workflowId: string, customerId: string): Promise<ServiceResponse<WorkflowTrigger>> {
    return this.executeQuery(async () => {
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

      if (error) throw error;
      if (!data) throw new Error('Failed to create webhook trigger: No data returned');

      // Generate unique webhook URL
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workflow-webhook?id=${data.id}`;
      
      // Update trigger with webhook URL
      const { error: updateError } = await supabase
        .from('workflow_triggers')
        .update({ webhook_url: webhookUrl })
        .eq('id', data.id);

      if (updateError) throw updateError;

      return { data: { ...data, webhook_url: webhookUrl } as unknown as WorkflowTrigger, error: null };
    });
  }

  /**
   * Create trigger with custom configuration
   * @param workflowId - The workflow's unique identifier
   * @param customerId - The customer's unique identifier
   * @param triggerData - Trigger configuration data
   * @returns The created trigger object
   * @throws Error if trigger creation fails
   */
  static async createTrigger(
    workflowId: string,
    customerId: string,
    triggerData: {
      trigger_type: string;
      trigger_config: Record<string, unknown>;
      is_enabled?: boolean;
    }
  ): Promise<ServiceResponse<WorkflowTrigger>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('workflow_triggers')
        .insert({
          workflow_id: workflowId,
          customer_id: customerId,
          trigger_type: triggerData.trigger_type,
          trigger_config: triggerData.trigger_config as never,
          is_enabled: triggerData.is_enabled ?? true
        })
        .select()
        .maybeSingle();
    });
  }

  /**
   * Toggle trigger enabled state
   * @param triggerId - The trigger's unique identifier
   * @param isEnabled - Current enabled state (will be toggled)
   * @throws Error if update fails
   */
  static async toggleTrigger(triggerId: string, isEnabled: boolean): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('workflow_triggers')
        .update({ is_enabled: !isEnabled })
        .eq('id', triggerId);

      if (error) throw error;
      return { data: undefined, error: null };
    });
  }
}
