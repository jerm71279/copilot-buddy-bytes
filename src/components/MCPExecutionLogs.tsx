import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock } from "lucide-react";
import { toast } from "sonner";
import { useMCPExecutionLogs } from "@/hooks/useMCPServers";
import { getMCPExecutionStatusBadge } from "@/lib/mcpUtils";

type MCPExecutionLogsProps = {
  customerId?: string;
};

export default function MCPExecutionLogs({ customerId }: MCPExecutionLogsProps) {
  const { logs, isLoading } = useMCPExecutionLogs(customerId, 50);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            MCP Execution Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          MCP Execution Logs
        </CardTitle>
        <CardDescription>
          Recent activity from your MCP tools and agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No execution logs yet. Test some tools to see activity here.
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{log.tool_name}</span>
                        {getMCPExecutionStatusBadge(log.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.execution_time_ms}ms
                        </span>
                        <span>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {log.error_message && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      {log.error_message}
                    </div>
                  )}

                  {log.input_data && Object.keys(log.input_data).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                        View Input Data
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.input_data, null, 2)}
                      </pre>
                    </details>
                  )}

                  {log.output_data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                        View Output Data
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.output_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
