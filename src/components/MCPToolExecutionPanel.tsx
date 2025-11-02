import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wrench, ArrowLeft } from "lucide-react";
import { MCPToolCard } from "./MCPToolCard";
import { MCPToolParametersForm } from "./MCPToolParametersForm";
import { MCPExecutionResults } from "./MCPExecutionResults";
import { useMCPTools, MCPTool, executeMCPTool } from "@/hooks/useMCPServers";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface MCPToolExecutionPanelProps {
  serverId: string;
  serverName: string;
  onBack: () => void;
}

export function MCPToolExecutionPanel({
  serverId,
  serverName,
  onBack,
}: MCPToolExecutionPanelProps) {
  const { tools, isLoading } = useMCPTools([serverId]);
  const { toast } = useToast();
  
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showParametersDialog, setShowParametersDialog] = useState(false);

  const serverTools = tools[serverId] || [];

  const handleExecuteTool = async (tool: MCPTool) => {
    setSelectedTool(tool);
    
    // Check if tool has parameters
    if (tool.parameters && Object.keys(tool.parameters).length > 0) {
      setShowParametersDialog(true);
    } else {
      // Execute immediately if no parameters
      await executeToolWithParams(tool, {});
    }
  };

  const executeToolWithParams = async (
    tool: MCPTool,
    parameters: Record<string, any>
  ) => {
    setIsExecuting(true);
    setShowParametersDialog(false);

    try {
      // Get auth session and customer ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to execute tools",
          variant: "destructive",
        });
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const customerId = profile?.customer_id;
      if (!customerId) {
        toast({
          title: "Profile error",
          description: "Customer profile not found",
          variant: "destructive",
        });
        return;
      }

      const result = await executeMCPTool(
        serverId,
        tool.tool_name,
        customerId,
        session.user.id,
        parameters
      );
      setExecutionResult(result);

      if (result.success) {
        toast({
          title: "Tool executed successfully",
          description: `${tool.tool_name} completed in ${result.execution_time_ms}ms`,
        });
      } else {
        toast({
          title: "Tool execution failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Execution error",
        description: error instanceof Error ? error.message : "Failed to execute tool",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Servers
          </Button>
          <CardTitle>Loading Tools...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[200px]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Servers
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tools: {serverName}
              </CardTitle>
              <CardDescription className="mt-1">
                Execute available tools on this server
              </CardDescription>
            </div>
            <Badge variant="outline">{serverTools.length} tools</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {serverTools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tools available for this server</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serverTools.map((tool) => (
                <MCPToolCard
                  key={tool.id}
                  tool={tool}
                  onExecute={handleExecuteTool}
                  isExecuting={isExecuting && selectedTool?.id === tool.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {executionResult && selectedTool && (
        <MCPExecutionResults
          result={executionResult}
          toolName={selectedTool.tool_name}
        />
      )}

      <Dialog open={showParametersDialog} onOpenChange={setShowParametersDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tool Parameters: {selectedTool?.tool_name}</DialogTitle>
            <DialogDescription>
              Enter the required parameters for this tool
            </DialogDescription>
          </DialogHeader>
          {selectedTool?.parameters && (
            <MCPToolParametersForm
              parameters={selectedTool.parameters}
              onSubmit={(params) => executeToolWithParams(selectedTool, params)}
              onCancel={() => setShowParametersDialog(false)}
              isExecuting={isExecuting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
