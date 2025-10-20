/**
 * Compliance Roadmap Type Definitions
 * Single source of truth for all roadmap-related types
 * Types match Supabase database schema
 */

// Database enum types (stored as text in DB)
export type RoadmapStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
export type StageType = 'assessment' | 'gap_analysis' | 'planning' | 'implementation' | 'testing' | 'audit_prep' | 'certification';

// Roadmap Stage (matches database columns exactly)
export interface RoadmapStage {
  id: string;
  framework_id: string;
  customer_id: string;
  stage_number: number;
  stage_name: string;
  stage_description: string;
  stage_type: string; // DB returns as string, not strict type
  estimated_duration_days: number;
  status: string; // DB returns as string, not strict type
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Roadmap Milestone (matches database columns exactly)
export interface RoadmapMilestone {
  id: string;
  stage_id: string;
  customer_id: string;
  milestone_name: string;
  milestone_description: string | null;
  sequence_order: number;
  required_actions: string[] | null;
  success_criteria: string[] | null;
  assigned_to: string | null;
  status: string; // DB returns as string, not strict type
  due_date: string | null;
  completed_at: string | null;
  evidence_required: boolean;
  linked_control_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

// Roadmap Resource
export interface RoadmapResource {
  id: string;
  stage_id: string | null;
  milestone_id: string | null;
  customer_id: string;
  resource_name: string;
  resource_type: 'document' | 'template' | 'checklist' | 'guide' | 'video' | 'tool' | 'external_link';
  resource_url: string | null;
  resource_description: string | null;
  is_required: boolean;
  created_at: string;
}

// Compliance Framework (minimal)
export interface ComplianceFramework {
  id: string;
  framework_code: string;
  framework_name: string;
  industry: string;
  description: string | null;
  version: string;
  is_active: boolean;
}

// Hook return types
export interface UseComplianceRoadmapReturn {
  frameworks: ComplianceFramework[] | undefined;
  stages: RoadmapStage[] | undefined;
  milestones: RoadmapMilestone[] | undefined;
  isLoading: boolean;
  initializeRoadmap: (frameworkId: string) => Promise<void>;
  updateStage: (params: UpdateStageParams) => Promise<void>;
  updateMilestone: (params: UpdateMilestoneParams) => Promise<void>;
}

export interface UpdateStageParams {
  stageId: string;
  status?: RoadmapStatus;
  progress?: number;
}

export interface UpdateMilestoneParams {
  milestoneId: string;
  status: MilestoneStatus;
}

// UI Component Props
export interface RoadmapTimelineProps {
  stages: RoadmapStage[];
}

export interface RoadmapMilestonesProps {
  stages: RoadmapStage[];
  milestones: RoadmapMilestone[];
}
