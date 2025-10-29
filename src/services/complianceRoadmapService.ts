/**
 * Compliance Roadmap Service
 * Handles compliance roadmap and framework operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
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
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  required_actions?: string[];
  success_criteria?: string[];
}

export class ComplianceRoadmapService {
  /**
   * Get active compliance frameworks
   * @returns Array of active compliance frameworks
   * @throws Error if database query fails
   */
  static async getFrameworks(): Promise<ComplianceFramework[]> {
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .select('*')
      .eq('is_active', true)
      .order('framework_name');

    if (error) throw new Error(`Failed to fetch compliance frameworks: ${error.message}`);
    return data as ComplianceFramework[];
  }

  /**
   * Initialize compliance roadmap for a framework
   * Creates default stages for the customer's compliance journey
   * @param frameworkId - The framework's unique identifier
   * @param customerId - The customer's unique identifier
   * @returns Initialization result
   * @throws Error if roadmap initialization fails
   */
  static async initializeRoadmap(frameworkId: string, customerId: string): Promise<unknown> {
    const { data, error } = await supabase.rpc('initialize_compliance_roadmap', {
      _framework_id: frameworkId,
      _customer_id: customerId
    });

    if (error) throw new Error(`Failed to initialize compliance roadmap: ${error.message}`);
    return data;
  }

  /**
   * Get roadmap stages for a specific framework and customer
   * @param frameworkId - The framework's unique identifier
   * @param customerId - The customer's unique identifier
   * @returns Array of roadmap stages ordered by stage number
   * @throws Error if database query fails
   */
  static async getRoadmapStages(frameworkId: string, customerId: string): Promise<RoadmapStage[]> {
    const { data, error } = await supabase
      .from('compliance_roadmap_stages')
      .select('*')
      .eq('framework_id', frameworkId)
      .eq('customer_id', customerId)
      .order('stage_number');

    if (error) throw new Error(`Failed to fetch roadmap stages: ${error.message}`);
    return data as RoadmapStage[];
  }

  /**
   * Get roadmap milestones for a specific stage
   * @param stageId - The stage's unique identifier
   * @returns Array of milestones ordered by sequence
   * @throws Error if database query fails
   */
  static async getRoadmapMilestones(stageId: string): Promise<RoadmapMilestone[]> {
    const { data, error } = await supabase
      .from('compliance_roadmap_milestones')
      .select('*')
      .eq('stage_id', stageId)
      .order('sequence_order');

    if (error) throw new Error(`Failed to fetch roadmap milestones: ${error.message}`);
    return data as RoadmapMilestone[];
  }

  /**
   * Update stage status
   * @param stageId - The stage's unique identifier
   * @param status - New status for the stage
   * @returns Updated stage data
   * @throws Error if update fails
   */
  static async updateStageStatus(
    stageId: string, 
    status: RoadmapStage['status']
  ): Promise<RoadmapStage> {
    const { data, error } = await supabase
      .from('compliance_roadmap_stages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', stageId)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update stage status: ${error.message}`);
    if (!data) throw new Error('Failed to update stage: No data returned');
    return data as RoadmapStage;
  }

  /**
   * Update milestone status
   * @param milestoneId - The milestone's unique identifier
   * @param status - New status for the milestone
   * @returns Updated milestone data
   * @throws Error if update fails
   */
  static async updateMilestoneStatus(
    milestoneId: string, 
    status: RoadmapMilestone['status']
  ): Promise<RoadmapMilestone> {
    const { data, error } = await supabase
      .from('compliance_roadmap_milestones')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', milestoneId)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update milestone status: ${error.message}`);
    if (!data) throw new Error('Failed to update milestone: No data returned');
    return data as RoadmapMilestone;
  }

  /**
   * Get all roadmap stages for a customer across all frameworks
   * @param customerId - The customer's unique identifier
   * @returns Array of all roadmap stages for the customer
   * @throws Error if database query fails
   */
  static async getCustomerRoadmapStages(customerId: string): Promise<RoadmapStage[]> {
    const { data, error } = await supabase
      .from('compliance_roadmap_stages')
      .select('*')
      .eq('customer_id', customerId)
      .order('stage_number');

    if (error) throw new Error(`Failed to fetch customer roadmap stages: ${error.message}`);
    return data as RoadmapStage[];
  }

  /**
   * Calculate overall roadmap progress for a framework
   * @param frameworkId - The framework's unique identifier
   * @param customerId - The customer's unique identifier
   * @returns Progress percentage (0-100)
   * @throws Error if calculation fails
   */
  static async calculateRoadmapProgress(
    frameworkId: string, 
    customerId: string
  ): Promise<number> {
    const stages = await this.getRoadmapStages(frameworkId, customerId);
    
    if (stages.length === 0) return 0;

    const completedStages = stages.filter(s => s.status === 'completed').length;
    return Math.round((completedStages / stages.length) * 100);
  }

  /**
   * Get roadmap statistics for a customer
   * @param customerId - The customer's unique identifier
   * @returns Statistics object with stage counts
   * @throws Error if query fails
   */
  static async getRoadmapStatistics(customerId: string): Promise<{
    totalStages: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    blocked: number;
    overallProgress: number;
  }> {
    const stages = await this.getCustomerRoadmapStages(customerId);

    const stats = {
      totalStages: stages.length,
      notStarted: stages.filter(s => s.status === 'not_started').length,
      inProgress: stages.filter(s => s.status === 'in_progress').length,
      completed: stages.filter(s => s.status === 'completed').length,
      blocked: stages.filter(s => s.status === 'blocked').length,
      overallProgress: stages.length > 0 
        ? Math.round((stages.filter(s => s.status === 'completed').length / stages.length) * 100)
        : 0
    };

    return stats;
  }
}
