/**
 * Roadmap Timeline Component
 * Displays compliance journey stages in a visual timeline
 * REFACTORED: Now uses shared utilities and types
 */

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RoadmapStatusIcon } from "./RoadmapStatusIcon";
import { RoadmapStatusBadge } from "./RoadmapStatusBadge";
import { getRoadmapStatusColor } from "@/lib/compliance/roadmap-utils";
import type { RoadmapTimelineProps } from "@/types/compliance-roadmap";

export const RoadmapTimeline = ({ stages }: RoadmapTimelineProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-6">Compliance Journey Timeline</h3>
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          
          {/* Stages */}
          <div className="space-y-6">
            {stages.map((stage) => (
              <div key={stage.id} className="relative flex gap-4">
                {/* Status Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <RoadmapStatusIcon 
                    status={stage.status} 
                    className="h-6 w-6"
                    animated={true}
                  />
                </div>
                
                {/* Stage Card */}
                <Card className={`flex-1 border-2 ${getRoadmapStatusColor(stage.status)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            Stage {stage.stage_number}
                          </span>
                          <RoadmapStatusBadge status={stage.status} type="roadmap" />
                        </div>
                        <h4 className="text-base font-semibold">{stage.stage_name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stage.stage_description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-primary">
                          {stage.progress_percentage}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ~{stage.estimated_duration_days} days
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar (only for started stages) */}
                    {stage.status !== 'not_started' && (
                      <Progress 
                        value={stage.progress_percentage} 
                        className="h-2 mt-3"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
