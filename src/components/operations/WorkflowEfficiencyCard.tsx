import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { workflowMetrics } from "@/lib/operationsConfig";

export function WorkflowEfficiencyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-System Workflow Efficiency</CardTitle>
        <CardDescription>Performance metrics across integrated systems</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {workflowMetrics.map((workflow) => (
          <div key={workflow.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{workflow.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{workflow.avgTime}</span>
                <Badge variant={workflow.badge.variant}>{workflow.badge.text}</Badge>
              </div>
            </div>
            <Progress 
              value={workflow.efficiency} 
              className={workflow.hasIssue ? "bg-destructive/20" : undefined}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
