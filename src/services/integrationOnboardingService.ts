import { supabase } from "@/integrations/supabase/client";
import { BaseService, ServiceResponse } from "./baseService";

export interface Integration {
  id: string;
  integration_name: string;
  system_type: string;
  vendor_name: string;
  connection_method: string;
  auth_method: string;
  base_url?: string;
  api_version?: string;
  status: string;
  health_status: string;
  last_health_check?: string;
  credential_vault_path?: string;
  credential_rotation_schedule?: string;
  last_credential_rotation?: string;
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  documentation_url?: string;
  edge_function_name?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
}

export interface OnboardingChecklistItem {
  id: string;
  integration_id: string;
  phase: string;
  step_number: string;
  step_description: string;
  responsible_role: string;
  status: string;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: string;
  integration_name: string;
  operation: string;
  status: string;
  request_data?: any;
  response_data?: any;
  error_message?: string;
  duration_ms?: number;
  customer_id?: string;
  user_id?: string;
  created_at: string;
}

export interface HealthCheck {
  id: string;
  integration_id: string;
  health_status: string;
  latency_ms?: number;
  error_message?: string;
  checked_at: string;
}

export class IntegrationOnboardingService extends BaseService {
  /**
   * Get all integrations
   */
  static async getIntegrations(): Promise<ServiceResponse<Integration[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_registry')
        .select('*')
        .order('created_at', { ascending: false });
    });
  }

  /**
   * Get integration by ID
   */
  static async getIntegration(id: string): Promise<ServiceResponse<Integration>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_registry')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    });
  }

  /**
   * Create new integration
   */
  static async createIntegration(data: Partial<Integration>): Promise<ServiceResponse<Integration>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_registry')
        .insert([data as any])
        .select()
        .maybeSingle();
    });
  }

  /**
   * Update integration
   */
  static async updateIntegration(
    id: string,
    updates: Partial<Integration>
  ): Promise<ServiceResponse<Integration>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_registry')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Delete integration
   */
  static async deleteIntegration(id: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('integration_registry')
        .delete()
        .eq('id', id);
      
      return { data: null, error };
    });
  }

  /**
   * Get onboarding checklist for an integration
   */
  static async getOnboardingChecklist(integrationId: string): Promise<ServiceResponse<OnboardingChecklistItem[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_onboarding_checklist')
        .select('*')
        .eq('integration_id', integrationId)
        .order('phase', { ascending: true })
        .order('step_number', { ascending: true });
    });
  }

  /**
   * Update checklist item
   */
  static async updateChecklistItem(
    id: string,
    updates: Partial<OnboardingChecklistItem>
  ): Promise<ServiceResponse<OnboardingChecklistItem>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_onboarding_checklist')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Initialize checklist for new integration
   */
  static async initializeChecklist(integrationId: string): Promise<ServiceResponse<OnboardingChecklistItem[]>> {
    const checklistTemplate = [
      // Phase 1: Discovery
      { phase: 'discovery', step_number: '1.1', step_description: 'System Type Review', responsible_role: 'Integration Lead' },
      { phase: 'discovery', step_number: '1.2', step_description: 'Authentication Method', responsible_role: 'Integration Lead' },
      { phase: 'discovery', step_number: '1.3', step_description: 'API Documentation Review', responsible_role: 'Integration Lead' },
      { phase: 'discovery', step_number: '1.4', step_description: 'Security Requirements', responsible_role: 'Security Team' },
      
      // Phase 2: Setup
      { phase: 'setup', step_number: '2.1', step_description: 'Credential Setup', responsible_role: 'Security Team' },
      { phase: 'setup', step_number: '2.2', step_description: 'Registry Entry', responsible_role: 'Integration Lead' },
      { phase: 'setup', step_number: '2.3', step_description: 'Sandbox Environment', responsible_role: 'DevOps' },
      
      // Phase 3: Development
      { phase: 'development', step_number: '3.1', step_description: 'Edge Function Development', responsible_role: 'Backend Developer' },
      { phase: 'development', step_number: '3.2', step_description: 'Input Validation', responsible_role: 'Backend Developer' },
      { phase: 'development', step_number: '3.3', step_description: 'Error Handling', responsible_role: 'Backend Developer' },
      { phase: 'development', step_number: '3.4', step_description: 'Audit Logging', responsible_role: 'Backend Developer' },
      
      // Phase 4: Workflow
      { phase: 'workflow', step_number: '4.1', step_description: 'Workflow Mapping', responsible_role: 'Workflow Designer' },
      { phase: 'workflow', step_number: '4.2', step_description: 'Trigger Configuration', responsible_role: 'Workflow Designer' },
      { phase: 'workflow', step_number: '4.3', step_description: 'Action Steps', responsible_role: 'Workflow Designer' },
      { phase: 'workflow', step_number: '4.4', step_description: 'Notification Setup', responsible_role: 'Workflow Designer' },
      
      // Phase 5: UI/UX
      { phase: 'ui_ux', step_number: '5.1', step_description: 'Dashboard Extension', responsible_role: 'Frontend Developer' },
      { phase: 'ui_ux', step_number: '5.2', step_description: 'Monitoring Setup', responsible_role: 'DevOps' },
      { phase: 'ui_ux', step_number: '5.3', step_description: 'Alert Configuration', responsible_role: 'DevOps' },
      
      // Phase 6: Testing
      { phase: 'testing', step_number: '6.1', step_description: 'Credential Test', responsible_role: 'QA' },
      { phase: 'testing', step_number: '6.2', step_description: 'Data Fetch Test', responsible_role: 'QA' },
      { phase: 'testing', step_number: '6.3', step_description: 'Workflow Dry Run', responsible_role: 'QA' },
      { phase: 'testing', step_number: '6.4', step_description: 'Error Scenario Test', responsible_role: 'QA' },
      { phase: 'testing', step_number: '6.5', step_description: 'Log Review', responsible_role: 'QA' },
      
      // Phase 7: Documentation
      { phase: 'documentation', step_number: '7.1', step_description: 'Technical Documentation', responsible_role: 'Technical Writer' },
      { phase: 'documentation', step_number: '7.2', step_description: 'User Documentation', responsible_role: 'Technical Writer' },
      { phase: 'documentation', step_number: '7.3', step_description: 'Runbook Creation', responsible_role: 'DevOps' },
      
      // Phase 8: Approval
      { phase: 'approval', step_number: '8.1', step_description: 'Security Review', responsible_role: 'Security Team' },
      { phase: 'approval', step_number: '8.2', step_description: 'Stakeholder Approval', responsible_role: 'Project Manager' },
      { phase: 'approval', step_number: '8.3', step_description: 'Production Deployment', responsible_role: 'DevOps' },
      
      // Phase 9: Post-Launch
      { phase: 'post_launch', step_number: '9.1', step_description: 'Monitoring Active', responsible_role: 'DevOps' },
      { phase: 'post_launch', step_number: '9.2', step_description: 'User Training', responsible_role: 'Training Team' },
      { phase: 'post_launch', step_number: '9.3', step_description: 'Feedback Collection', responsible_role: 'Product Manager' },
    ];

    const checklistItems = checklistTemplate.map(item => ({
      integration_id: integrationId,
      ...item,
      status: 'pending',
    }));

    return this.executeQuery(async () => {
      return await supabase
        .from('integration_onboarding_checklist')
        .insert(checklistItems)
        .select();
    });
  }

  /**
   * Get integration logs
   */
  static async getIntegrationLogs(
    integrationName: string,
    limit: number = 100
  ): Promise<ServiceResponse<IntegrationLog[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_logs')
        .select('*')
        .eq('integration_name', integrationName)
        .order('created_at', { ascending: false })
        .limit(limit);
    });
  }

  /**
   * Get health check history
   */
  static async getHealthCheckHistory(
    integrationId: string,
    limit: number = 100
  ): Promise<ServiceResponse<HealthCheck[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_health_checks')
        .select('*')
        .eq('integration_id', integrationId)
        .order('checked_at', { ascending: false })
        .limit(limit);
    });
  }

  /**
   * Get integration statistics
   */
  static async getIntegrationStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    planning: number;
    healthy: number;
    unhealthy: number;
  }>> {
    return this.executeQuery(async () => {
      const { data: integrations, error } = await supabase
        .from('integration_registry')
        .select('status, health_status');

      if (error) return { data: null, error };

      const stats = {
        total: integrations?.length || 0,
        active: integrations?.filter(i => i.status === 'active').length || 0,
        planning: integrations?.filter(i => i.status === 'planning').length || 0,
        healthy: integrations?.filter(i => i.health_status === 'healthy').length || 0,
        unhealthy: integrations?.filter(i => i.health_status === 'unhealthy').length || 0,
      };

      return { data: stats, error: null };
    });
  }
}
