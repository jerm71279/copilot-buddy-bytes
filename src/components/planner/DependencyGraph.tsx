import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface Task {
  id: string;
  task_name: string;
  status: string;
  is_critical_path: boolean;
}

interface Dependency {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  dependency_type: string;
  is_hard_dependency: boolean;
}

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: Dependency[];
}

export function DependencyGraph({ tasks, dependencies }: DependencyGraphProps) {
  const getTaskDependencies = (taskId: string) => {
    const predecessors = dependencies
      .filter(d => d.successor_task_id === taskId)
      .map(d => tasks.find(t => t.id === d.predecessor_task_id))
      .filter(Boolean);

    const successors = dependencies
      .filter(d => d.predecessor_task_id === taskId)
      .map(d => tasks.find(t => t.id === d.successor_task_id))
      .filter(Boolean);

    return { predecessors, successors };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10 border-success";
      case "in_progress": return "bg-primary/10 border-primary";
      case "blocked": return "bg-destructive/10 border-destructive";
      case "not_started": return "bg-muted/50 border-border";
      default: return "bg-muted/50 border-border";
    }
  };

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case "finish_to_start": return "FS";
      case "start_to_start": return "SS";
      case "finish_to_finish": return "FF";
      case "start_to_finish": return "SF";
      default: return type;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tasks to display. Create tasks to see dependencies.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dependency Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{dependencies.length}</div>
          <div className="text-sm text-muted-foreground">Total Dependencies</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {dependencies.filter(d => d.is_hard_dependency).length}
          </div>
          <div className="text-sm text-muted-foreground">Hard Dependencies</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {tasks.filter(t => t.is_critical_path).length}
          </div>
          <div className="text-sm text-muted-foreground">Critical Path Tasks</div>
        </Card>
      </div>

      {/* Task Dependency Cards */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const { predecessors, successors } = getTaskDependencies(task.id);
          
          if (predecessors.length === 0 && successors.length === 0) {
            return null;
          }

          return (
            <Card key={task.id} className="p-6">
              <div className="space-y-4">
                {/* Central Task */}
                <div className="flex justify-center">
                  <div
                    className={`px-6 py-4 rounded-lg border-2 ${getStatusColor(task.status)} ${
                      task.is_critical_path ? "shadow-lg ring-2 ring-destructive" : ""
                    }`}
                  >
                    <div className="font-semibold text-center">{task.task_name}</div>
                    <div className="flex justify-center gap-2 mt-2">
                      <Badge variant="outline">{task.status}</Badge>
                      {task.is_critical_path && (
                        <Badge variant="destructive">Critical</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dependencies Layout */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Predecessors (Left) */}
                  <div>
                    {predecessors.length > 0 && (
                      <>
                        <div className="text-sm font-semibold text-muted-foreground mb-3">
                          Depends On ({predecessors.length})
                        </div>
                        <div className="space-y-2">
                          {predecessors.map((pred: any) => {
                            const dep = dependencies.find(
                              d => d.predecessor_task_id === pred.id && d.successor_task_id === task.id
                            );
                            return (
                              <div
                                key={pred.id}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className={`flex-1 px-4 py-2 rounded border ${getStatusColor(pred.status)} text-sm`}
                                >
                                  {pred.task_name}
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                <Badge variant="secondary" className="text-xs">
                                  {getDependencyTypeLabel(dep?.dependency_type || "")}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Successors (Right) */}
                  <div>
                    {successors.length > 0 && (
                      <>
                        <div className="text-sm font-semibold text-muted-foreground mb-3">
                          Blocks ({successors.length})
                        </div>
                        <div className="space-y-2">
                          {successors.map((succ: any) => {
                            const dep = dependencies.find(
                              d => d.predecessor_task_id === task.id && d.successor_task_id === succ.id
                            );
                            return (
                              <div
                                key={succ.id}
                                className="flex items-center gap-2"
                              >
                                <Badge variant="secondary" className="text-xs">
                                  {getDependencyTypeLabel(dep?.dependency_type || "")}
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                <div
                                  className={`flex-1 px-4 py-2 rounded border ${getStatusColor(succ.status)} text-sm`}
                                >
                                  {succ.task_name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dependency Type Legend */}
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Dependency Types</div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <Badge variant="secondary">FS</Badge>
            <span className="ml-2 text-muted-foreground">Finish-to-Start</span>
          </div>
          <div>
            <Badge variant="secondary">SS</Badge>
            <span className="ml-2 text-muted-foreground">Start-to-Start</span>
          </div>
          <div>
            <Badge variant="secondary">FF</Badge>
            <span className="ml-2 text-muted-foreground">Finish-to-Finish</span>
          </div>
          <div>
            <Badge variant="secondary">SF</Badge>
            <span className="ml-2 text-muted-foreground">Start-to-Finish</span>
          </div>
        </div>
      </Card>
    </div>
  );
}