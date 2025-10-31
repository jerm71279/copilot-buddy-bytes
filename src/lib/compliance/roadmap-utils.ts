/**
 * Compliance Roadmap Utility Functions
 * Shared logic for status handling, calculations, and formatting
 */

import type { RoadmapStatus, MilestoneStatus, RoadmapStage } from '@/types/compliance-roadmap';

// Status color mappings (design system tokens)
export const STATUS_COLORS = {
  roadmap: {
    completed: 'border-success bg-success/5',
    in_progress: 'border-primary bg-primary/5',
    blocked: 'border-destructive bg-destructive/5',
    not_started: 'border-border bg-muted/30',
  },
  milestone: {
    completed: 'bg-success/10 text-success border-success',
    in_progress: 'bg-primary/10 text-primary border-primary',
    blocked: 'bg-destructive/10 text-destructive border-destructive',
    pending: 'bg-muted text-muted-foreground',
    skipped: 'bg-muted/50 text-muted-foreground',
  },
} as const;

// Badge color mappings
export const BADGE_VARIANTS = {
  roadmap: {
    completed: 'bg-success text-success-foreground',
    in_progress: 'bg-primary text-primary-foreground',
    blocked: 'bg-destructive text-destructive-foreground',
    not_started: 'bg-muted text-muted-foreground',
  },
  milestone: {
    completed: 'bg-success/10 text-success border-success',
    in_progress: 'bg-primary/10 text-primary border-primary',
    blocked: 'bg-destructive/10 text-destructive border-destructive',
    pending: 'bg-muted text-muted-foreground',
    skipped: 'bg-muted/50 text-muted-foreground',
  },
} as const;

/**
 * Get the appropriate border/background color for a roadmap status
 */
export const getRoadmapStatusColor = (status: string): string => {
  const validStatuses: Record<string, string> = STATUS_COLORS.roadmap;
  return validStatuses[status as RoadmapStatus] || STATUS_COLORS.roadmap.not_started;
};

/**
 * Get the appropriate badge variant for a status
 */
export const getStatusBadgeVariant = (
  status: string,
  type: 'roadmap' | 'milestone' = 'roadmap'
): string => {
  const variants = BADGE_VARIANTS[type];
  return variants[status as keyof typeof variants] || 
         (type === 'roadmap' ? BADGE_VARIANTS.roadmap.not_started : BADGE_VARIANTS.milestone.pending);
};


/**
 * Calculate overall roadmap progress from stages
 */
export const calculateOverallProgress = (stages: RoadmapStage[]): number => {
  if (!stages || stages.length === 0) return 0;
  const total = stages.reduce((sum, stage) => sum + (stage.progress_percentage || 0), 0);
  return Math.round(total / stages.length);
};

/**
 * Get stage statistics
 */
export const getStageStatistics = (stages: RoadmapStage[]) => {
  return {
    completed: stages.filter(s => s.status === 'completed').length,
    inProgress: stages.filter(s => s.status === 'in_progress').length,
    notStarted: stages.filter(s => s.status === 'not_started').length,
    blocked: stages.filter(s => s.status === 'blocked').length,
    total: stages.length,
  };
};

/**
 * Estimate completion date based on remaining stages
 */
export const estimateCompletionDate = (stages: RoadmapStage[]): Date | null => {
  const pendingStages = stages.filter(
    s => s.status === 'not_started' || s.status === 'in_progress'
  );
  
  if (pendingStages.length === 0) return null;
  
  const totalDays = pendingStages.reduce(
    (sum, stage) => sum + stage.estimated_duration_days, 
    0
  );
  
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + totalDays);
  
  return completionDate;
};

/**
 * Check if roadmap stage is editable
 */
export const isStageEditable = (stage: RoadmapStage): boolean => {
  return stage.status !== 'completed';
};

/**
 * Check if milestone can be completed
 */
export const canCompleteMilestone = (
  status: MilestoneStatus,
  evidenceRequired: boolean,
  hasEvidence: boolean = false
): boolean => {
  if (status === 'completed' || status === 'skipped') return false;
  if (evidenceRequired && !hasEvidence) return false;
  return true;
};

/**
 * Validate stage number sequence
 */
export const validateStageSequence = (stages: RoadmapStage[]): boolean => {
  if (stages.length === 0) return true;
  
  const sortedStages = [...stages].sort((a, b) => a.stage_number - b.stage_number);
  
  for (let i = 0; i < sortedStages.length; i++) {
    if (sortedStages[i].stage_number !== i + 1) {
      return false;
    }
  }
  
  return true;
};
