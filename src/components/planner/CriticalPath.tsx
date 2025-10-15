import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

interface Task {
  id: string;
  task_name: string;
  start_date: string;
  due_date: string;
  task_status?: string;
  status?: string;
  completion_percentage: number;
  estimated_hours: number | null;
  actual_hours: number | null;
}

interface Dependency {
  predecessor_task_id: string;
  successor_task_id: string;
}

interface CriticalPathProps {
  tasks: Task[];
  dependencies: Dependency[];
}

export function CriticalPath({ tasks, dependencies }: CriticalPathProps) {
  const sortedTasks = [...tasks].sort(
    (a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
  );

  const getTaskDuration = (task: Task) => {
    if (!task.start_date || !task.due_date) return 0;
    return differenceInDays(parseISO(task.due_date), parseISO(task.start_date)) + 1;
  };

  const getTotalDuration = () => {
    if (tasks.length === 0) return 0;
    return tasks.reduce((sum, task) => sum + getTaskDuration(task), 0);
  };

  const getTotalSlack = () => {
    // Calculate total slack as percentage of tasks completed
    const completed = tasks.filter(t => (t.status ?? t.task_status) === "completed").length;
    return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10 text-success border-success/30";
      case "in_progress": return "bg-primary/10 text-primary border-primary/30";
      case "blocked": return "bg-destructive/10 text-destructive border-destructive/30";
      case "not_started": return "bg-muted/50 text-muted-foreground border-border";
      default: return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  const getNextTask = (currentTaskId: string) => {
    const dep = dependencies.find(d => d.predecessor_task_id === currentTaskId);
    return dep ? tasks.find(t => t.id === dep.successor_task_id) : null;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No critical path tasks identified.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Path Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{tasks.length}</div>
          <div className="text-sm text-muted-foreground">Critical Tasks</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{getTotalDuration()}</div>
          <div className="text-sm text-muted-foreground">Days on Path</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-destructive">
            {tasks.filter(t => (t.status ?? t.task_status) === "blocked").length}
          </div>
          <div className="text-sm text-muted-foreground">Blocked Tasks</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{getTotalSlack()}%</div>
          <div className="text-sm text-muted-foreground">Completion Rate</div>
        </Card>
      </div>

      {/* Warning for Blocked Tasks */}
      {tasks.some(t => (t.status ?? t.task_status) === "blocked") && (
        <Card className="p-4 bg-destructive/10 border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <div className="font-semibold text-destructive">Critical Path Blocked</div>
              <div className="text-sm text-destructive/80 mt-1">
                {tasks.filter(t => (t.status ?? t.task_status) === "blocked").length} critical task(s) are blocked. 
                This will delay the entire project timeline.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Critical Path Flow */}
      <Card className="p-6">
        <div className="text-lg font-semibold mb-6">Critical Path Sequence</div>
        <div className="space-y-4">
          {sortedTasks.map((task, index) => {
            const nextTask = getNextTask(task.id);
            const duration = getTaskDuration(task);
            const isDelayed = task.actual_hours && task.estimated_hours 
              && task.actual_hours > task.estimated_hours;

            return (
              <div key={task.id}>
                <div className={`p-4 rounded-lg border-2 ${getStatusColor(task.status ?? task.task_status ?? 'not_started')}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-semibold text-lg">{task.task_name}</span>
                        {isDelayed && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Delayed
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Start Date</div>
                          <div className="font-medium">
                            {format(parseISO(task.start_date), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Date</div>
                          <div className="font-medium">
                            {task.due_date ? format(parseISO(task.due_date), "MMM d, yyyy") : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-medium">{duration} days</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {task.completion_percentage}%
                      </div>
                      <Badge className="mt-2">{task.status ?? task.task_status ?? 'not_started'}</Badge>
                    </div>
                  </div>

                  {/* Effort Tracking */}
                  {(task.estimated_hours || task.actual_hours) && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-6 text-sm">
                        {task.estimated_hours && (
                          <div>
                            <span className="text-muted-foreground">Estimated: </span>
                            <span className="font-medium">{task.estimated_hours}h</span>
                          </div>
                        )}
                        {task.actual_hours && (
                          <div>
                            <span className="text-muted-foreground">Actual: </span>
                            <span className={`font-medium ${isDelayed ? "text-destructive" : ""}`}>
                              {task.actual_hours}h
                            </span>
                          </div>
                        )}
                        {isDelayed && (
                          <div>
                            <span className="text-muted-foreground">Variance: </span>
                            <span className="font-medium text-destructive">
                              +{task.actual_hours! - task.estimated_hours!}h
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connector Arrow */}
                {nextTask && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Impact Analysis */}
      <Card className="p-6">
        <div className="text-lg font-semibold mb-4">Impact Analysis</div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
            <span>Earliest Project Completion</span>
            <span className="font-semibold">
              {tasks.length > 0 && sortedTasks[sortedTasks.length - 1].due_date
                ? format(parseISO(sortedTasks[sortedTasks.length - 1].due_date), "MMM d, yyyy")
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
            <span>Critical Path Duration</span>
            <span className="font-semibold">{getTotalDuration()} days</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
            <span>Tasks at Risk</span>
            <span className="font-semibold text-destructive">
              {tasks.filter(t => {
                const status = t.status ?? t.task_status;
                return status === "blocked" || status === "in_progress";
              }).length}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}