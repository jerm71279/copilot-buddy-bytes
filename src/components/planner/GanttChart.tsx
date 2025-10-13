import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, eachQuarterOfInterval } from "date-fns";

interface Task {
  id: string;
  task_name: string;
  start_date: string;
  end_date: string;
  status: string;
  completion_percentage: number;
  is_critical_path: boolean;
}

interface Milestone {
  id: string;
  milestone_name: string;
  target_date: string;
  status: string;
}

interface GanttChartProps {
  tasks: Task[];
  milestones: Milestone[];
  dependencies: any[];
  viewMode: "month" | "quarter" | "year";
}

export function GanttChart({ tasks, milestones, viewMode }: GanttChartProps) {
  const { timelineStart, timelineEnd, timelineUnits } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        timelineStart: startOfMonth(today),
        timelineEnd: endOfMonth(today),
        timelineUnits: eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) }),
      };
    }

    const allDates = [
      ...tasks.map(t => parseISO(t.start_date)),
      ...tasks.map(t => parseISO(t.end_date)),
      ...milestones.map(m => parseISO(m.target_date)),
    ];

    const start = new Date(Math.min(...allDates.map(d => d.getTime())));
    const end = new Date(Math.max(...allDates.map(d => d.getTime())));

    let units;
    if (viewMode === "month") {
      units = eachDayOfInterval({ start, end });
    } else if (viewMode === "quarter") {
      units = eachMonthOfInterval({ start, end });
    } else {
      units = eachQuarterOfInterval({ start, end });
    }

    return {
      timelineStart: start,
      timelineEnd: end,
      timelineUnits: units,
    };
  }, [tasks, milestones, viewMode]);

  const calculateBarPosition = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    const startOffset = differenceInDays(start, timelineStart);
    const duration = differenceInDays(end, start);

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "blocked": return "bg-red-500";
      case "not_started": return "bg-gray-400";
      default: return "bg-gray-300";
    }
  };

  const formatTimelineUnit = (date: Date) => {
    if (viewMode === "month") return format(date, "d");
    if (viewMode === "quarter") return format(date, "MMM");
    return format(date, "QQQ yyyy");
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tasks to display. Create tasks to see the Gantt chart.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <div className="flex border-b">
            <div className="w-64 flex-shrink-0 p-4 font-semibold border-r">
              Task Name
            </div>
            <div className="flex-1 relative">
              <div className="flex h-12 border-l">
                {timelineUnits.map((unit, index) => (
                  <div
                    key={index}
                    className="flex-1 border-r text-center text-xs py-1 text-muted-foreground"
                    style={{ minWidth: "40px" }}
                  >
                    {formatTimelineUnit(unit)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Bars */}
          <div className="space-y-1">
            {tasks.map((task) => {
              const position = calculateBarPosition(task.start_date, task.end_date);
              
              return (
                <div key={task.id} className="flex items-center hover:bg-muted/50">
                  <div className="w-64 flex-shrink-0 p-2 border-r">
                    <div className="text-sm font-medium truncate" title={task.task_name}>
                      {task.task_name}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {task.is_critical_path && (
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {task.completion_percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 relative h-12 border-l">
                    <div className="absolute inset-0 flex items-center px-1">
                      <div
                        className={`h-8 rounded ${getStatusColor(task.status)} ${
                          task.is_critical_path ? "border-2 border-red-600" : ""
                        } relative`}
                        style={position}
                      >
                        {/* Completion indicator */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-white/30 rounded-l"
                          style={{ width: `${task.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex">
                <div className="w-64 flex-shrink-0 p-4 font-semibold border-r">
                  Milestones
                </div>
                <div className="flex-1 relative h-12 border-l">
                  {milestones.map((milestone) => {
                    const position = calculateBarPosition(milestone.target_date, milestone.target_date);
                    
                    return (
                      <div
                        key={milestone.id}
                        className="absolute"
                        style={{ left: position.left }}
                        title={milestone.milestone_name}
                      >
                        <div className="w-4 h-4 bg-yellow-500 rotate-45 border-2 border-yellow-700" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded" />
          <span>Not Started</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rotate-45 border-2 border-yellow-700" />
          <span>Milestone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded border-2 border-red-600" />
          <span>Critical Path</span>
        </div>
      </div>
    </div>
  );
}