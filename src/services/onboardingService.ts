/**
 * Onboarding Service
 * Centralized data operations for Client Onboarding Management
 */

import { supabase } from "@/integrations/supabase/client";

export interface ClientOnboarding {
  id: string;
  client_name: string;
  status: string;
  completion_percentage: number;
  start_date: string | null;
  target_completion_date: string | null;
  created_at: string;
}

export interface OnboardingStats {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export class OnboardingService {
  /**
   * Get all client onboardings
   */
  static async getClientOnboardings() {
    const { data, error } = await supabase
      .from('client_onboardings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ClientOnboarding[];
  }

  /**
   * Get onboarding statistics
   */
  static async getOnboardingStats(): Promise<OnboardingStats> {
    const onboardings = await this.getClientOnboardings();

    const total = onboardings.length;
    const inProgress = onboardings.filter(o => o.status === 'in_progress').length;
    const completed = onboardings.filter(o => o.status === 'completed').length;
    const overdue = onboardings.filter(o => {
      if (!o.target_completion_date || o.status === 'completed') return false;
      return new Date(o.target_completion_date) < new Date();
    }).length;

    return { total, inProgress, completed, overdue };
  }

  /**
   * Get a single onboarding by ID
   */
  static async getOnboardingById(id: string) {
    const { data, error } = await supabase
      .from('client_onboardings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as ClientOnboarding | null;
  }

  /**
   * Create a new client onboarding
   */
  static async createOnboarding(onboarding: Partial<ClientOnboarding>) {
    const { data, error } = await supabase
      .from('client_onboardings')
      .insert(onboarding as any)
      .select()
      .single();

    if (error) throw error;
    return data as ClientOnboarding;
  }

  /**
   * Update an onboarding
   */
  static async updateOnboarding(id: string, updates: Partial<ClientOnboarding>) {
    const { data, error } = await supabase
      .from('client_onboardings')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ClientOnboarding;
  }

  /**
   * Delete an onboarding
   */
  static async deleteOnboarding(id: string) {
    const { error } = await supabase
      .from('client_onboardings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get onboarding tasks for a specific onboarding
   */
  static async getOnboardingTasks(onboardingId: string) {
    const { data, error } = await supabase
      .from('client_onboarding_tasks')
      .select('*')
      .eq('onboarding_id', onboardingId)
      .order('sequence_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get onboarding templates
   */
  static async getOnboardingTemplates() {
    const { data, error } = await supabase
      .from('onboarding_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_name');

    if (error) throw error;
    return data || [];
  }
}
