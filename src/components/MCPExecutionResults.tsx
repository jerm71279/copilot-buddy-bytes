import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  execution_time_ms?: number;
}

interface MCPExecutionResultsProps {
  result: ExecutionResult;
  toolName: string;
}

export function MCPExecutionResults({ result, toolName }: MCPExecutionResultsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Execution Results: {toolName}</CardTitle>
          <div className="flex items-center gap-2">
            {result.execution_time_ms !== undefined && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {result.execution_time_ms}ms
              </Badge>
            )}
            {result.success ? (
              <Badge variant="default" className="gap-1 bg-primary/20 text-primary border-primary/60">
                <CheckCircle className="h-3 w-3" />
                Success
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          {result.success ? (
            <pre className="text-sm">
              {typeof result.data === 'string'
                ? result.data
                : JSON.stringify(result.data, null, 2)}
            </pre>
          ) : (
            <div className="text-destructive">
              <p className="font-semibold mb-2">Error:</p>
              <p className="text-sm">{result.error || 'Unknown error occurred'}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
