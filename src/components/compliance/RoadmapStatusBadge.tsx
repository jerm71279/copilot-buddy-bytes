/**
 * Reusable Status Badge Component
 * Provides consistent badge styling for roadmap and milestone statuses
 */

import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant, formatStatusLabel } from '@/lib/compliance/roadmap-utils';
import type { RoadmapStatus, MilestoneStatus } from '@/types/compliance-roadmap';

interface RoadmapStatusBadgeProps {
  status: string;
  type?: 'roadmap' | 'milestone';
  className?: string;
}

export const RoadmapStatusBadge = ({ 
  status, 
  type = 'roadmap',
  className = '' 
}: RoadmapStatusBadgeProps) => {
  const variant = getStatusBadgeVariant(status, type);
  
  return (
    <Badge variant="outline" className={`${variant} ${className}`}>
      {formatStatusLabel(status)}
    </Badge>
  );
};
