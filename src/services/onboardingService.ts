/**
 * Onboarding Service
 * Handles employee onboarding operations
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface OnboardingTemplate {
  id: string;
  customer_id: string;
  template_name: string;
  description?: string;
  department_type?: string;
  estimated_days?: number;
  is_active: boolean;
}

export interface OnboardingTask {
  id: string;
  status: string;
  task_name: string;
  description: string | null;
  sequence_order: number | null;
  task_category: string;
  onboarding_id: string;
}

export interface ClientOnboarding {
  id: string;
  employee_name: string;
  employee_email: string;
  customer_id: string;
  status: string;
  completion_percentage: number | null;
  start_date: string | null;
  target_completion_date: string | null;
  created_at: string | null;
}

export interface OnboardingStats {
  total_onboardings: number;
  active_onboardings: number;
  completed_onboardings: number;
  avg_completion_percentage: number;
  // Aliases for compatibility
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export class OnboardingService extends BaseService {
  /**
   * Get all roles
   */
  static async getRoles(): Promise<ServiceResponse<Role[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('roles')
        .select('*')
        .order('name');
    });
  }

  /**
   * Get onboarding templates
   */
  static async getTemplates(customerId: string): Promise<ServiceResponse<OnboardingTemplate[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('employee_onboarding_templates')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('template_name');
    });
  }

  /**
   * Get template tasks
   */
  static async getTemplateTasks(templateId: string): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('employee_onboarding_template_tasks')
        .select('*')
        .eq('template_id', templateId)
        .order('sequence_order');
    });
  }

  /**
   * Copy template tasks to onboarding
   */
  static async copyTemplateTasks(templateId: string, onboardingId: string): Promise<ServiceResponse<any[]>> {
    const tasksResponse = await this.getTemplateTasks(templateId);
    if (tasksResponse.error || !tasksResponse.data) {
      return tasksResponse as ServiceResponse<any[]>;
    }
    
    const tasks = tasksResponse.data;
    const onboardingTasks = tasks.map(task => ({
      onboarding_id: onboardingId,
      task_name: task.task_name,
      description: task.description,
      task_category: task.task_category,
      sequence_order: task.sequence_order,
      estimated_hours: task.estimated_hours,
      assigned_role: task.assigned_role,
      requires_employee_input: task.requires_employee_input,
      status: 'not_started',
      required_documents: task.required_documents,
      compliance_tags: task.compliance_tags,
      template_task_id: task.id
    }));

    return this.executeQuery(async () => {
      return await supabase
        .from('employee_onboarding_tasks')
        .insert(onboardingTasks)
        .select();
    });
  }

  /**
   * Get onboarding tasks
   */
  static async getOnboardingTasks(onboardingId: string): Promise<ServiceResponse<OnboardingTask[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('employee_onboarding_tasks')
        .select('*')
        .eq('onboarding_id', onboardingId)
        .order('sequence_order');
    });
  }

  /**
   * Calculate onboarding progress
   */
  static async calculateProgress(onboardingId: string): Promise<ServiceResponse<{
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
  }>> {
    const tasksResponse = await this.getOnboardingTasks(onboardingId);
    if (tasksResponse.error) {
      return { data: null, error: tasksResponse.error };
    }
    
    if (!tasksResponse.data) {
      return { data: { totalTasks: 0, completedTasks: 0, progressPercentage: 0 }, error: null };
    }
    
    const tasks = tasksResponse.data;
    
    if (tasks.length === 0) {
      return { 
        data: { totalTasks: 0, completedTasks: 0, progressPercentage: 0 }, 
        error: null 
      };
    }

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progressPercentage = Math.round((completedTasks / tasks.length) * 100);

    return {
      data: {
        totalTasks: tasks.length,
        completedTasks,
        progressPercentage
      },
      error: null
    };
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(taskId: string, status: string): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('employee_onboarding_tasks')
        .update({ status })
        .eq('id', taskId)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Create onboarding
   */
  static async createOnboarding(onboarding: any): Promise<ServiceResponse<ClientOnboarding>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('employee_onboardings')
        .insert([onboarding])
        .select()
        .maybeSingle();
    });
  }

  /**
   * Get client onboardings
   */
  static async getClientOnboardings(customerId: string): Promise<ServiceResponse<ClientOnboarding[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('employee_onboardings')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
    });
  }

  /**
   * Get onboarding stats
   */
  static async getOnboardingStats(customerId: string): Promise<ServiceResponse<OnboardingStats>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('employee_onboardings')
        .select('*')
        .eq('customer_id', customerId);

      if (error) return { data: null, error };

      const total = data?.length || 0;
      const active = data?.filter(o => o.status === 'in_progress').length || 0;
      const completed = data?.filter(o => o.status === 'completed').length || 0;
      const overdue = data?.filter(o => {
        const targetDate = o.target_completion_date;
        return targetDate && new Date(targetDate) < new Date() && o.status !== 'completed';
      }).length || 0;
      const avgCompletion = total > 0
        ? Math.round(data.reduce((sum, o) => sum + (o.completion_percentage || 0), 0) / total)
        : 0;

      return {
        data: {
          total_onboardings: total,
          active_onboardings: active,
          completed_onboardings: completed,
          avg_completion_percentage: avgCompletion,
          // Aliases for compatibility
          total,
          inProgress: active,
          completed,
          overdue
        },
        error: null
      };
    });
  }
}

