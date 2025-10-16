import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause } from "lucide-react";
import { getStatusColor } from "@/lib/automationConfig";

interface WorkflowListCardProps {
  workflow: any;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export const WorkflowListCard = ({ workflow, onToggleStatus }: WorkflowListCardProps) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {workflow.workflow_name}
              <Badge variant={getStatusColor(workflow.is_active) as any}>
                {workflow.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {workflow.description || "No description"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(workflow.id, workflow.is_active);
            }}
          >
            {workflow.is_active ? (
              <><Pause className="mr-2 h-4 w-4" /> Pause</>
            ) : (
              <><Play className="mr-2 h-4 w-4" /> Activate</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="capitalize">Type: {workflow.workflow_type.replace('_', ' ')}</span>
          <span>•</span>
          <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};
