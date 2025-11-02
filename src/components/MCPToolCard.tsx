import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";
import { MCPTool } from "@/hooks/useMCPServers";

interface MCPToolCardProps {
  tool: MCPTool;
  onExecute: (tool: MCPTool) => void;
  isExecuting?: boolean;
}

export function MCPToolCard({ tool, onExecute, isExecuting }: MCPToolCardProps) {
  const paramCount = tool.parameters ? Object.keys(tool.parameters).length : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {tool.tool_name}
              {tool.is_dangerous && (
                <Badge variant="destructive" className="text-xs">
                  Dangerous
                </Badge>
              )}
            </CardTitle>
            {tool.description && (
              <CardDescription className="text-sm mt-1">
                {tool.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>{paramCount} parameter{paramCount !== 1 ? 's' : ''}</span>
            </div>
            {tool.execution_count !== undefined && (
              <span>Executed {tool.execution_count}x</span>
            )}
          </div>

          {tool.required_permissions && tool.required_permissions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tool.required_permissions.map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          )}

          <Button
            onClick={() => onExecute(tool)}
            disabled={isExecuting}
            className="w-full"
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? 'Executing...' : 'Execute Tool'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
