import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";

interface RoadmapStage {
  id: string;
  stage_number: number;
  stage_name: string;
  stage_description: string;
  stage_type: string;
  status: string;
  progress_percentage: number;
  estimated_duration_days: number;
}

interface RoadmapTimelineProps {
  stages: RoadmapStage[];
}

export const RoadmapTimeline = ({ stages }: RoadmapTimelineProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case 'in_progress':
        return <Clock className="h-6 w-6 text-primary animate-pulse" />;
      case 'blocked':
        return <AlertCircle className="h-6 w-6 text-destructive" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-success bg-success/5';
      case 'in_progress': return 'border-primary bg-primary/5';
      case 'blocked': return 'border-destructive bg-destructive/5';
      default: return 'border-border bg-muted/30';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-success text-success-foreground',
      in_progress: 'bg-primary text-primary-foreground',
      blocked: 'bg-destructive text-destructive-foreground',
      not_started: 'bg-muted text-muted-foreground',
    };
    
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-6">Compliance Journey Timeline</h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          
          {/* Stages */}
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative flex gap-4">
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  {getStatusIcon(stage.status)}
                </div>
                
                {/* Content */}
                <Card className={`flex-1 border-2 ${getStatusColor(stage.status)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            Stage {stage.stage_number}
                          </span>
                          {getStatusBadge(stage.status)}
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
