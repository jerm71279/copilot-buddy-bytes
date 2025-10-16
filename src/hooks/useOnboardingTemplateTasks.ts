/**
 * Centralized template task copying logic
 * Eliminates duplicate task copying code across HR portal
 */

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CopyTasksResult {
  success: boolean;
  tasksCreated: number;
  error?: any;
}

/**
 * Copy tasks from template to onboarding if needed
 */
export async function copyTemplateTasks(
  onboardingId: string,
  templateId: string,
  userId: string,
  showToast: (options: any) => void
): Promise<CopyTasksResult> {
  try {
    // Check if tasks already exist
    const { data: existingTasks } = await supabase
      .from('employee_onboarding_tasks')
      .select('id')
      .eq('onboarding_id', onboardingId)
      .limit(1);

    // If tasks exist, skip
    if (existingTasks && existingTasks.length > 0) {
      return { success: true, tasksCreated: 0 };
    }

    // Get template tasks
    const { data: templateTasks, error: templateError } = await supabase
      .from('employee_onboarding_template_tasks')
      .select('*')
      .eq('template_id', templateId)
      .order('sequence_order');

    if (templateError) throw templateError;

    if (!templateTasks || templateTasks.length === 0) {
      return { success: true, tasksCreated: 0 };
    }

    // Prepare tasks for insertion
    const tasksToInsert = templateTasks.map((task: any) => ({
      onboarding_id: onboardingId,
      task_name: task.task_name,
      description: task.description,
      task_category: task.task_category,
      sequence_order: task.sequence_order,
      assigned_role: task.assigned_role,
      estimated_hours: task.estimated_hours,
      requires_employee_input: task.requires_employee_input,
      compliance_tags: task.compliance_tags,
      required_documents: task.required_documents,
      status: 'not_started',
      created_by: userId
    }));

    // Insert tasks
    const { error: insertError } = await supabase
      .from('employee_onboarding_tasks')
      .insert(tasksToInsert);

    if (insertError) throw insertError;

    showToast({
      title: "Tasks Created",
      description: `${tasksToInsert.length} onboarding tasks have been added from the template`
    });

    return { success: true, tasksCreated: tasksToInsert.length };
  } catch (error) {
    console.error('Error copying template tasks:', error);
    return { success: false, tasksCreated: 0, error };
  }
}

/**
 * Hook for copying template tasks with toast support
 */
export function useOnboardingTemplateTasks() {
  const { toast } = useToast();

  const copyTasks = async (
    onboardingId: string,
    templateId: string,
    userId: string
  ): Promise<CopyTasksResult> => {
    return copyTemplateTasks(onboardingId, templateId, userId, toast);
  };

  return { copyTasks };
}
