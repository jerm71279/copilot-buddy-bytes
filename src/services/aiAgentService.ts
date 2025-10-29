/**
 * AI Agent Service
 * Centralized AI agent management
 */

import { supabase } from "@/integrations/supabase/client";

export interface AgentState {
  id?: string;
  department: string;
  agent_name: string;
  status: string;
  configuration?: any;
  current_task?: string | null;
  last_action_at?: string;
  metrics?: any;
  error_count?: number;
  success_count?: number;
}

export interface AgentTask {
  id?: string;
  department: string;
  task_type: string;
  task_name: string;
  task_config?: any;
  schedule_cron?: string | null;
  is_active: boolean;
  priority: number;
  last_executed_at?: string | null;
  next_execution_at?: string | null;
  execution_count?: number;
  success_count?: number;
  failure_count?: number;
}

export interface AgentAlert {
  id: string;
  department: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  recommended_actions: string[];
}

export class AIAgentService {
  /**
   * Get all agent states for a customer
   */
  static async getAgentStates(customerId: string) {
    const { data, error } = await supabase
      .from('ai_agent_state')
      .select('*')
      .eq('customer_id', customerId)
      .order('department');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all agent tasks for a customer
   */
  static async getAgentTasks(customerId: string) {
    const { data, error } = await supabase
      .from('ai_agent_tasks')
      .select('*')
      .eq('customer_id', customerId)
      .order('department');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get active agent tasks for a customer
   */
  static async getActiveAgentTasks(customerId: string) {
    const { data, error } = await supabase
      .from('ai_agent_tasks')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get agent alerts for a customer
   */
  static async getAgentAlerts(customerId: string) {
    const { data, error } = await supabase
      .from('ai_agent_alerts')
      .select('*')
      .eq('customer_id', customerId)
      .in('status', ['new', 'acknowledged'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data || []).map(alert => ({
      ...alert,
      recommended_actions: (alert.recommended_actions as any) || []
    })) as AgentAlert[];
  }

  /**
   * Create or update agent state
   */
  static async saveAgent(customerId: string, agent: AgentState) {
    if (agent.id) {
      // Update existing
      const { error } = await supabase
        .from('ai_agent_state')
        .update({
          agent_name: agent.agent_name,
          department: agent.department,
          status: agent.status,
          configuration: agent.configuration
        })
        .eq('id', agent.id);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('ai_agent_state')
        .insert([{
          agent_name: agent.agent_name,
          department: agent.department,
          configuration: agent.configuration || {},
          customer_id: customerId,
          status: agent.status || 'active'
        }]);

      if (error) throw error;
    }
  }

  /**
   * Create or update agent task
   */
  static async saveTask(customerId: string, task: AgentTask) {
    if (task.id) {
      // Update existing
      const { error } = await supabase
        .from('ai_agent_tasks')
        .update({
          task_name: task.task_name,
          department: task.department,
          task_type: task.task_type,
          task_config: task.task_config,
          schedule_cron: task.schedule_cron,
          is_active: task.is_active,
          priority: task.priority
        })
        .eq('id', task.id);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('ai_agent_tasks')
        .insert([{
          task_name: task.task_name,
          department: task.department,
          task_type: task.task_type,
          task_config: task.task_config || {},
          schedule_cron: task.schedule_cron,
          is_active: task.is_active ?? true,
          priority: task.priority || 5,
          customer_id: customerId
        }]);

      if (error) throw error;
    }
  }

  /**
   * Delete agent task
   */
  static async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('ai_agent_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }

  /**
   * Acknowledge agent alert
   */
  static async acknowledgeAlert(alertId: string, userId: string) {
    const { error } = await supabase
      .from('ai_agent_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  /**
   * Get task repetition analysis suggestions
   */
  static async getAutomationSuggestions(userId: string) {
    const { data, error } = await supabase
      .from('task_repetition_analysis')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'suggested')
      .order('repetition_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Dismiss automation suggestion
   */
  static async dismissSuggestion(suggestionId: string) {
    const { error } = await supabase
      .from('task_repetition_analysis')
      .update({ status: 'dismissed' })
      .eq('id', suggestionId);

    if (error) throw error;
  }
}
