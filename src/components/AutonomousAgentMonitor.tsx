import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Bot, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

interface AgentState {
  id: string;
  department: string;
  agent_name: string;
  status: string;
  current_task: string | null;
  last_action_at: string;
  metrics: any;
  error_count: number;
  success_count: number;
}

interface AgentAlert {
  id: string;
  department: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  recommended_actions: string[];
}

interface AgentTask {
  id: string;
  department: string;
  task_type: string;
  task_name: string;
  is_active: boolean;
  last_executed_at: string | null;
  next_execution_at: string | null;
  execution_count: number;
  success_count: number;
  failure_count: number;
}

export const AutonomousAgentMonitor = () => {
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [agentAlerts, setAgentAlerts] = useState<AgentAlert[]>([]);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
    
    // Set up real-time subscriptions
    const stateChannel = supabase
      .channel('agent-state-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agent_state'
      }, () => loadAgentData())
      .subscribe();

    const alertsChannel = supabase
      .channel('agent-alerts-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_agent_alerts'
      }, (payload) => {
        toast.warning(`New agent alert: ${payload.new.title}`, {
          description: payload.new.description
        });
        loadAgentData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stateChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const loadAgentData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Load agent states
      const { data: states } = await supabase
        .from('ai_agent_state')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('department');

      // Load alerts
      const { data: alerts } = await supabase
        .from('ai_agent_alerts')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .in('status', ['new', 'acknowledged'])
        .order('created_at', { ascending: false })
        .limit(10);

      // Load tasks
      const { data: tasks } = await supabase
        .from('ai_agent_tasks')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      setAgentStates(states || []);
      setAgentAlerts((alerts || []).map(alert => ({
        ...alert,
        recommended_actions: (alert.recommended_actions as any) || []
      })) as AgentAlert[]);
      setAgentTasks(tasks || []);
    } catch (error) {
      console.error('Failed to load agent data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('ai_agent_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast.success('Alert acknowledged');
      loadAgentData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'destructive';
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading agent data...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>Autonomous AI Agents</CardTitle>
            </div>
            <Badge variant="outline">{agentStates.length} Active</Badge>
          </div>
          <CardDescription>
            Monitor and manage AI agents running across all departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="agents">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="alerts">
                Alerts {agentAlerts.length > 0 && `(${agentAlerts.length})`}
              </TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {agentStates.map((agent) => (
                    <Card key={agent.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              <span className="font-semibold">{agent.department}</span>
                              <Badge variant={getStatusColor(agent.status)}>
                                {agent.status}
                              </Badge>
                            </div>
                            {agent.current_task && (
                              <p className="text-sm text-muted-foreground">
                                Current: {agent.current_task}
                              </p>
                            )}
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {agent.success_count} successes
                              </span>
                              {agent.error_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-destructive" />
                                  {agent.error_count} errors
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(agent.last_action_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {agentStates.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                      No agents configured yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {agentAlerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-semibold">{alert.title}</span>
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <Badge variant="outline">{alert.department}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Recommended:</span>
                              <ul className="list-disc list-inside text-muted-foreground">
                                {alert.recommended_actions.map((action, idx) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                            <span className="text-xs text-muted-foreground ml-auto self-center">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {agentAlerts.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                      No active alerts
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {agentTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              <span className="font-semibold">{task.task_name}</span>
                              <Badge variant="outline">{task.task_type}</Badge>
                              <Badge variant="outline">{task.department}</Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>{task.execution_count} executions</span>
                              <span>{task.success_count} successes</span>
                              {task.failure_count > 0 && (
                                <span className="text-destructive">
                                  {task.failure_count} failures
                                </span>
                              )}
                            </div>
                            {task.next_execution_at && (
                              <p className="text-xs text-muted-foreground">
                                Next: {new Date(task.next_execution_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {agentTasks.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                      No active tasks scheduled
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};