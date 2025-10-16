/**
 * Centralized onboarding progress calculation hook
 * Eliminates duplicate progress calculation logic across HR portal
 */

import { supabase } from "@/integrations/supabase/client";

export interface OnboardingTask {
  id: string;
  status: string;
  [key: string]: any;
}

export interface ProgressCalculation {
  completionPercentage: number;
  onboardingStatus: 'not_started' | 'in_progress' | 'completed';
  completedCount: number;
  inProgressCount: number;
  totalCount: number;
}

/**
 * Calculate progress from task array
 * Weighted: completed = 100%, in_progress = 50%
 */
export function calculateProgress(tasks: OnboardingTask[]): ProgressCalculation {
  const totalCount = tasks.length;
  
  if (totalCount === 0) {
    return {
      completionPercentage: 0,
      onboardingStatus: 'not_started',
      completedCount: 0,
      inProgressCount: 0,
      totalCount: 0
    };
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  
  const completionPercentage = Math.round(
    ((completedCount + 0.5 * inProgressCount) / totalCount) * 100
  );

  const onboardingStatus = 
    completedCount === totalCount 
      ? 'completed'
      : (inProgressCount > 0 || completedCount > 0)
        ? 'in_progress'
        : 'not_started';

  return {
    completionPercentage,
    onboardingStatus,
    completedCount,
    inProgressCount,
    totalCount
  };
}

/**
 * Update onboarding progress in database
 */
export async function updateOnboardingProgress(
  onboardingId: string,
  progress: ProgressCalculation
): Promise<{ error: any | null }> {
  const { error } = await supabase
    .from('employee_onboardings')
    .update({
      completion_percentage: progress.completionPercentage,
      status: progress.onboardingStatus
    })
    .eq('id', onboardingId);

  return { error };
}

/**
 * Calculate and persist progress for an onboarding
 */
export async function syncOnboardingProgress(
  onboardingId: string,
  tasks: OnboardingTask[]
): Promise<{ progress: ProgressCalculation; error: any | null }> {
  const progress = calculateProgress(tasks);
  const { error } = await updateOnboardingProgress(onboardingId, progress);
  
  return { progress, error };
}
