import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { 
  Save, 
  Play, 
  ArrowLeft,
  Plus,
  Zap,
  Settings,
  GitBranch,
  Repeat,
  Clock,
  Globe
} from "lucide-react";
import { toast } from "sonner";

// Custom node components
const TriggerNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-primary text-primary-foreground border-2 border-primary">
    <div className="flex items-center gap-2">
      <Zap className="h-4 w-4" />
      <div className="font-bold">{data.label}</div>
    </div>
  </div>
);

const ActionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-primary text-primary-foreground border-2 border-primary">
    <div className="flex items-center gap-2">
      <Settings className="h-4 w-4" />
      <div className="font-bold">{data.label}</div>
    </div>
  </div>
);

const ConditionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-warning text-warning-foreground border-2 border-warning">
    <div className="flex items-center gap-2">
      <GitBranch className="h-4 w-4" />
      <div className="font-bold">{data.label}</div>
    </div>
  </div>
);

const LoopNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-secondary text-secondary-foreground border-2 border-secondary">
    <div className="flex items-center gap-2">
      <Repeat className="h-4 w-4" />
      <div className="font-bold">{data.label}</div>
    </div>
  </div>
);

const DelayNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-accent text-accent-foreground border-2 border-accent">
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4" />
      <div className="font-bold">{data.label}</div>
    </div>
  </div>
);

const ApiCallNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-success text-white border-2 border-success">
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4" />
      <div className="font-bold">{data.label}</div>
    </div>
  </div>
);

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
  delay: DelayNode,
  api_call: ApiCallNode,
};

export default function VisualWorkflowBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [workflowCategory, setWorkflowCategory] = useState("automation");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch existing workflow if editing
  useQuery({
    queryKey: ["workflow-edit", workflowId],
    enabled: !!workflowId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_templates" as any)
        .select("*")
        .eq("id", workflowId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Workflow not found");
      
      const workflow = data as any;
      setWorkflowName(workflow.name || "");
      setWorkflowDescription(workflow.description || "");
      setWorkflowCategory(workflow.category || "automation");
      if (workflow.nodes) setNodes(workflow.nodes);
      if (workflow.edges) setEdges(workflow.edges);
      
      return data;
    },
  });

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.customer_id) throw new Error("No customer ID");

      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        category: workflowCategory,
        nodes: nodes,
        edges: edges,
        customer_id: profile.customer_id,
        created_by: user.id,
        updated_by: user.id
      };

      if (workflowId) {
        const { error } = await supabase
          .from("workflow_templates" as any)
          .update(workflowData)
          .eq("id", workflowId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("workflow_templates" as any)
          .insert(workflowData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
      toast.success("Workflow saved successfully");
      navigate('/workflow-orchestration');
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` }
    };
    setNodes((nds) => nds.concat(newNode));
    toast.success("Node added to canvas");
  }, [setNodes]);

  return (
    <div className="container mx-auto px-4 pt-56 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/workflow-orchestration')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Visual Workflow Builder</h1>
            <p className="text-muted-foreground">
              {workflowId ? 'Edit' : 'Create'} your workflow with drag-and-drop
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Test
          </Button>
          <Button onClick={() => saveWorkflowMutation.mutate()} disabled={saveWorkflowMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar - Node Palette */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('trigger')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Trigger
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('action')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Action
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('condition')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Condition
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('loop')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Loop
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('delay')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Delay
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('api_call')}
            >
              <Plus className="mr-2 h-4 w-4" />
              API Call
            </Button>
          </CardContent>
        </Card>

        {/* Main Canvas Area */}
        <div className="col-span-3 space-y-4">
          {/* Workflow Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={workflowCategory} onValueChange={setWorkflowCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="data_processing">Data Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Workflow Canvas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag nodes to reposition, connect nodes by dragging from edge to edge
              </p>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)] p-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-muted/20"
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}