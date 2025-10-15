import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Allocation {
  id: string;
  user_id: string;
  task_id: string;
  allocation_percentage: number;
  start_date: string;
  end_date: string;
  role: string | null;
}

interface Task {
  id: string;
  task_name: string;
  status: string;
}

interface ResourceTimelineProps {
  allocations: Allocation[];
  tasks: Task[];
}

export function ResourceTimeline({ allocations, tasks }: ResourceTimelineProps) {
  // Group allocations by user
  const allocationsByUser = allocations.reduce((acc, allocation) => {
    if (!acc[allocation.user_id]) {
      acc[allocation.user_id] = [];
    }
    acc[allocation.user_id].push(allocation);
    return acc;
  }, {} as Record<string, Allocation[]>);

  const calculateUserUtilization = (userAllocations: Allocation[]) => {
    // Calculate average allocation percentage across all tasks
    const totalAllocation = userAllocations.reduce((sum, a) => sum + a.allocation_percentage, 0);
    return Math.round(totalAllocation / userAllocations.length);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return "text-destructive";
    if (utilization > 80) return "text-warning";
    if (utilization > 60) return "text-primary";
    return "text-secondary";
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization > 100) return "Overallocated";
    if (utilization > 80) return "High Utilization";
    if (utilization > 60) return "Optimal";
    return "Underutilized";
  };

  if (allocations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No resource allocations yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Utilization Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{Object.keys(allocationsByUser).length}</div>
          <div className="text-sm text-muted-foreground">Team Members</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{allocations.length}</div>
          <div className="text-sm text-muted-foreground">Total Allocations</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {Object.values(allocationsByUser).filter(
              (userAllocations) => calculateUserUtilization(userAllocations) > 100
            ).length}
          </div>
          <div className="text-sm text-muted-foreground">Overallocated</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {Object.values(allocationsByUser).filter(
              (userAllocations) => calculateUserUtilization(userAllocations) < 60
            ).length}
          </div>
          <div className="text-sm text-muted-foreground">Underutilized</div>
        </Card>
      </div>

      {/* Resource Utilization by User */}
      <div className="space-y-4">
        {Object.entries(allocationsByUser).map(([userId, userAllocations]) => {
          const utilization = calculateUserUtilization(userAllocations);
          const roles = [...new Set(userAllocations.map(a => a.role).filter(Boolean))];

          return (
            <Card key={userId} className="p-6">
              <div className="space-y-4">
                {/* User Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">User {userId.slice(0, 8)}</div>
                    {roles.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {roles.map((role, idx) => (
                          <Badge key={idx} variant="secondary">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getUtilizationColor(utilization)}`}>
                      {utilization}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getUtilizationStatus(utilization)}
                    </div>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div>
                  <Progress value={Math.min(utilization, 100)} className="h-2" />
                </div>

                {/* Task Assignments */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted-foreground">
                    Assigned Tasks ({userAllocations.length})
                  </div>
                  {userAllocations.map((allocation) => {
                    const task = tasks.find(t => t.id === allocation.task_id);
                    if (!task) return null;

                    return (
                      <div
                        key={allocation.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{task.task_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(allocation.start_date).toLocaleDateString()} -{" "}
                            {new Date(allocation.end_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task.status}</Badge>
                          <Badge>{allocation.allocation_percentage}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}