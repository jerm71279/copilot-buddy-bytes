/**
 * Compliance Roadmap Service
 * Handles compliance roadmap and framework operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface ComplianceFramework {
  id: string;
  framework_name: string;
  framework_code?: string;
  version?: string;
  description?: string;
  is_active: boolean;
}

export interface RoadmapStage {
  id: string;
  framework_id: string;
  customer_id: string;
  stage_name: string;
  stage_description: string | null;
  stage_type: string;
  stage_number: number;
  status: string;
  progress_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapMilestone {
  id: string;
  stage_id: string;
  milestone_name: string;
  milestone_description?: string;
  due_date?: string;
  status: string;
  required_actions?: string[];
  success_criteria?: string[];
}

export class ComplianceRoadmapService {
  /**
   * Get active compliance frameworks
   */
  static async getFrameworks() {
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .select('*')
      .eq('is_active', true)
      .order('framework_name');

    if (error) throw error;
    return data as ComplianceFramework[];
  }

  /**
   * Initialize roadmap for framework
   */
  static async initializeRoadmap(frameworkId: string, customerId: string) {
    const { data, error } = await supabase.rpc('initialize_compliance_roadmap', {
      _framework_id: frameworkId,
      _customer_id: customerId
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get roadmap stages
   */
  static async getRoadmapStages(frameworkId: string, customerId: string) {
    const { data, error } = await supabase
      .from('compliance_roadmap_stages')
      .select('*')
      .eq('framework_id', frameworkId)
      .eq('customer_id', customerId)
      .order('stage_number');

    if (error) throw error;
    return data as RoadmapStage[];
  }

  /**
   * Get roadmap milestones for stage
   */
  static async getRoadmapMilestones(stageId: string) {
    const { data, error } = await supabase
      .from('compliance_roadmap_milestones')
      .select('*')
      .eq('stage_id', stageId)
      .order('sequence_order');

    if (error) throw error;
    return data as RoadmapMilestone[];
  }

  /**
   * Update stage status
   */
  static async updateStageStatus(stageId: string, status: string) {
    const { data, error } = await supabase
      .from('compliance_roadmap_stages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', stageId)
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to update stage');
    return data as RoadmapStage;
  }

  /**
   * Update milestone status
   */
  static async updateMilestoneStatus(milestoneId: string, status: string) {
    const { data, error } = await supabase
      .from('compliance_roadmap_milestones')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', milestoneId)
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to update milestone');
    return data as RoadmapMilestone;
  }
}
