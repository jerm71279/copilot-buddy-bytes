import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, ArrowLeft, BookOpen, Lightbulb, Sparkles, Scissors } from "lucide-react";
import { MCPToolCard } from "./MCPToolCard";
import { MCPToolParametersForm } from "./MCPToolParametersForm";
import { MCPExecutionResults } from "./MCPExecutionResults";
import { MCPCapabilitySection, getCapabilityIcon } from "./MCPCapabilitySection";
import { MCPInstructionsList } from "./MCPInstructionsList";
import { MCPKnowledgeList } from "./MCPKnowledgeList";
import { MCPKnowledgeManager } from "./MCPKnowledgeManager";
import { MCPRAGQuery } from "./MCPRAGQuery";
import { MCPKnowledgeUpload } from "./MCPKnowledgeUpload";
import { MCPChunkingSettings } from "./MCPChunkingSettings";
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

  // Mock data - in production, this would come from server metadata
  const instructions = [
    {
      id: '1',
      title: 'Getting Started',
      content: 'This server provides tools for engineering contact management. Start by reviewing available tools and their parameters.',
      priority: 'high' as const,
    },
    {
      id: '2',
      title: 'Authentication',
      content: 'All tool executions require valid authentication. Ensure your session is active before executing tools.',
      priority: 'medium' as const,
    },
  ];

  const knowledgeResources = [
    {
      id: '1',
      title: 'API Documentation',
      description: 'Complete API reference for all available tools and endpoints',
      type: 'document' as const,
      url: '#',
    },
    {
      id: '2',
      title: 'Server Database Schema',
      description: 'Database structure and relationships for this MCP server',
      type: 'database' as const,
    },
  ];

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
                Engineering Contact: {serverName}
              </CardTitle>
              <CardDescription className="mt-1">
                Instructions, knowledge resources, and executable tools
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rag" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="rag" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
              <TabsTrigger value="instruction" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Instruction
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-2">
                <Wrench className="h-4 w-4" />
                Tools
                <Badge variant="secondary" className="ml-1">{serverTools.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Scissors className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rag" className="space-y-4">
              <MCPRAGQuery serverId={serverId} serverName={serverName} />
            </TabsContent>

            <TabsContent value="instruction" className="space-y-4">
              <MCPCapabilitySection
                type="instruction"
                title="Server Instructions"
                description="Guidelines and instructions for using this server"
                count={instructions.length}
                icon={getCapabilityIcon('instruction')}
              >
                <MCPInstructionsList instructions={instructions} />
              </MCPCapabilitySection>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-4">
              <div className="flex justify-end mb-4">
                <MCPKnowledgeUpload serverId={serverId} />
              </div>
              <MCPCapabilitySection
                type="knowledge"
                title="Knowledge Base"
                description="Uploaded documentation and reference materials"
                count={0}
                icon={getCapabilityIcon('knowledge')}
              >
                <MCPKnowledgeManager serverId={serverId} />
              </MCPCapabilitySection>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4">
              <MCPCapabilitySection
                type="tools"
                title="Executable Tools"
                description="Available tools for this server"
                count={serverTools.length}
                icon={getCapabilityIcon('tools')}
              >
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
              </MCPCapabilitySection>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <MCPChunkingSettings />
            </TabsContent>
          </Tabs>
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
