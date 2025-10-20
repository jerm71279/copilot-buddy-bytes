/**
 * Reusable Status Icon Component
 * Provides consistent iconography for roadmap and milestone statuses
 */

import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import type { RoadmapStatus, MilestoneStatus } from '@/types/compliance-roadmap';

interface RoadmapStatusIconProps {
  status: string;
  className?: string;
  animated?: boolean;
}

export const RoadmapStatusIcon = ({ 
  status, 
  className = "h-5 w-5",
  animated = false 
}: RoadmapStatusIconProps) => {
  const baseClassName = animated && status === 'in_progress' 
    ? `${className} animate-pulse` 
    : className;

  switch (status) {
    case 'completed':
      return <CheckCircle2 className={`${baseClassName} text-success`} />;
    case 'in_progress':
      return <Clock className={`${baseClassName} text-primary`} />;
    case 'blocked':
      return <AlertCircle className={`${baseClassName} text-destructive`} />;
    case 'not_started':
    case 'pending':
    case 'skipped':
    default:
      return <Circle className={`${baseClassName} text-muted-foreground`} />;
  }
};
