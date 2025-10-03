import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, XCircle, Clock, Play } from "lucide-react";

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  triggered_by: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  execution_log: any[];
  workflows: {
    workflow_name: string;
  };
}

export const WorkflowExecutionHistory = ({ customerId }: { customerId: string }) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExecutions();
  }, [customerId]);

  const fetchExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from("workflow_executions")
        .select(`
          *,
          workflows(workflow_name)
        `)
        .eq("customer_id", customerId)
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setExecutions((data || []) as any);
    } catch (error: any) {
      console.error("Error fetching executions:", error);
      toast.error("Failed to load execution history");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: "default",
      failed: "destructive",
      running: "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatDuration = (started: string, completed: string | null) => {
    if (!completed) return "Running...";
    
    const start = new Date(started).getTime();
    const end = new Date(completed).getTime();
    const durationMs = end - start;
    
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${(durationMs / 60000).toFixed(1)}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Execution History</CardTitle>
            <CardDescription>Recent workflow executions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchExecutions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No executions yet. Create and run a workflow to see results here.
          </div>
        ) : (
          <div className="space-y-4">
            {executions.map((execution) => (
              <Card key={execution.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(execution.status)}
                        <h4 className="font-semibold">
                          {execution.workflows?.workflow_name || "Unknown Workflow"}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          Triggered: {new Date(execution.started_at).toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>
                          Duration: {formatDuration(execution.started_at, execution.completed_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{execution.triggered_by}</Badge>
                      {getStatusBadge(execution.status)}
                    </div>
                  </div>

                  {execution.error_message && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive mb-4">
                      <strong>Error:</strong> {execution.error_message}
                    </div>
                  )}

                  {execution.execution_log && execution.execution_log.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Execution Steps:</div>
                      <div className="space-y-1">
                        {execution.execution_log.map((log: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {log.result?.success ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span className="font-mono text-xs">{log.step_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.step_type}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {log.duration_ms}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
