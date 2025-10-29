/**
 * Automation Service
 * Handles workflow automation operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface Workflow {
  id: string;
  customer_id: string;
  workflow_name: string;
  description: string | null;
  workflow_type: string | null;
  is_active: boolean;
  steps: any | null;
  compliance_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export class AutomationService {
  /**
   * Get workflows by customer
   */
  static async getWorkflows(customerId: string) {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Workflow[];
  }

  /**
   * Create workflow
   */
  static async createWorkflow(workflow: any) {
    const { data, error } = await supabase
      .from('workflows')
      .insert([workflow])
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to create workflow');
    return data as Workflow;
  }

  /**
   * Update workflow
   */
  static async updateWorkflow(id: string, updates: Partial<Workflow>) {
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to update workflow');
    return data as Workflow;
  }

  /**
   * Delete workflow
   */
  static async deleteWorkflow(id: string) {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Toggle workflow active status
   */
  static async toggleWorkflow(id: string, isActive: boolean) {
    return this.updateWorkflow(id, { is_active: isActive });
  }
}
