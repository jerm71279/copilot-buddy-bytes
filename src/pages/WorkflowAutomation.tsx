import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Zap, Play, Pause, Plus, Clock, CheckCircle2, GitBranch } from "lucide-react";

interface Workflow {
  id: string;
  workflow_name: string;
  description: string | null;
  workflow_type: string;
  is_active: boolean;
  created_at: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export default function WorkflowAutomation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    executions: 0,
    successRate: 0
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    await loadWorkflows();
  };

  const loadWorkflows = async () => {
    try {
      const [workflowsRes, executionsRes] = await Promise.all([
        supabase.from('workflows').select('*').order('created_at', { ascending: false }),
        supabase.from('workflow_executions').select('*').order('started_at', { ascending: false }).limit(20)
      ]);

      if (workflowsRes.error) throw workflowsRes.error;
      if (executionsRes.error) throw executionsRes.error;

      setWorkflows(workflowsRes.data || []);
      setExecutions(executionsRes.data || []);

      const total = workflowsRes.data?.length || 0;
      const active = workflowsRes.data?.filter(w => w.is_active).length || 0;
      const totalExecs = executionsRes.data?.length || 0;
      const successExecs = executionsRes.data?.filter(e => e.status === 'completed').length || 0;
      const successRate = totalExecs > 0 ? Math.round((successExecs / totalExecs) * 100) : 0;

      setStats({ total, active, executions: totalExecs, successRate });
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWorkflowStatus = async (id: string, currentIsActive: boolean) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: !currentIsActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Workflow ${!currentIsActive ? 'activated' : 'deactivated'}`
      });

      await loadWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  const getExecutionStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      running: "default",
      completed: "default",
      failed: "destructive"
    };
    return colors[status] || "secondary";
  };

  const getExecutionIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'running') return <Clock className="h-4 w-4 text-blue-600" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Workflow Automation</h1>
            <p className="text-muted-foreground">Automate repetitive tasks and connect systems</p>
          </div>
          <Button onClick={() => navigate('/workflows/builder')}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Total Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Active Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Play className="h-4 w-4" />
                Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.executions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="workflows" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  Loading workflows...
                </CardContent>
              </Card>
            ) : workflows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first automation workflow</p>
                  <Button onClick={() => navigate('/workflows/builder')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workflow
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {workflows.map((workflow) => (
                  <Card 
                    key={workflow.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {workflow.workflow_name}
                            <Badge variant={getStatusColor(workflow.is_active) as any}>
                              {workflow.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {workflow.description || "No description"}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkflowStatus(workflow.id, workflow.is_active);
                          }}
                        >
                          {workflow.is_active ? (
                            <><Pause className="mr-2 h-4 w-4" /> Pause</>
                          ) : (
                            <><Play className="mr-2 h-4 w-4" /> Activate</>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">Type: {workflow.workflow_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            {executions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
                  <p className="text-muted-foreground">Workflow executions will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {executions.map((execution) => (
                  <Card key={execution.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {getExecutionIcon(execution.status)}
                          <div>
                            <p className="font-medium">
                              {workflows.find(w => w.id === execution.workflow_id)?.workflow_name || 'Unknown Workflow'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Started {new Date(execution.started_at).toLocaleString()}
                              {execution.completed_at && ` • Completed ${new Date(execution.completed_at).toLocaleString()}`}
                            </p>
                            {execution.error_message && (
                              <p className="text-sm text-red-600 mt-1">{execution.error_message}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={getExecutionStatusColor(execution.status) as any}>
                          {execution.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
