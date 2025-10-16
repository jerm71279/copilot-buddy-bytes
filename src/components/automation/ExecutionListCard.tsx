import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExecutionStatusColor, getExecutionIcon, getTriggerLabel } from "@/lib/automationConfig";

interface ExecutionListCardProps {
  execution: any;
  workflowName: string;
}

export const ExecutionListCard = ({ execution, workflowName }: ExecutionListCardProps) => {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 flex-1">
            {getExecutionIcon(execution.status)}
            <div className="flex-1">
              <p className="font-semibold text-base">{workflowName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {getTriggerLabel(execution.triggered_by)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Started {new Date(execution.started_at).toLocaleString()}
                {execution.completed_at && ` • Completed in ${((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(1)}s`}
              </p>
              {execution.error_message && (
                <p className="text-sm text-destructive mt-2 p-2 bg-destructive/5 rounded">
                  {execution.error_message}
                </p>
              )}
            </div>
          </div>
          <Badge variant={getExecutionStatusColor(execution.status) as any}>
            {execution.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
