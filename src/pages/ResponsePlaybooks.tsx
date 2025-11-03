import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Play, CheckCircle, Clock, AlertCircle, Shield, AlertTriangle, FileWarning, Database, FileText, Activity, Mail } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";

interface Playbook {
  id: string;
  customer_id: string;
  playbook_name: string;
  playbook_type: string;
  description?: string;
  automation_level: string;
  trigger_conditions: any;
  steps: any;
  estimated_duration_minutes?: number;
  success_rate?: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

interface PlaybookExecution {
  id: string;
  playbook_id: string;
  execution_status: string;
  started_at?: string;
  completed_at?: string;
  current_step: number;
  total_steps: number;
  was_successful?: boolean;
  created_at: string;
}

export default function ResponsePlaybooks() {
  const navigate = useNavigate();
  const { customerId } = useUserProfile();
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  const { data: playbooks = [], isLoading: playbooksLoading } = useQuery<Playbook[]>({
    queryKey: ['response-playbooks', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('response_playbooks' as any)
        .select('*')
        .eq('customer_id', customerId)
        .order('playbook_name');
      
      if (error) throw error;
      return (data || []) as unknown as Playbook[];
    },
    enabled: !!customerId,
  });

  const { data: executions = [] } = useQuery<PlaybookExecution[]>({
    queryKey: ['playbook-executions', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbook_executions' as any)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as unknown as PlaybookExecution[];
    },
    enabled: !!customerId,
  });

  const getAutomationColor = (level: string): any => {
    const colors: Record<string, any> = {
      manual: 'outline',
      semi_automated: 'default',
      fully_automated: 'default'
    };
    return colors[level] || 'outline';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident_response': return <AlertCircle className="h-4 w-4" />;
      case 'threat_hunt': return <BookOpen className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const getExecutionStatus = (status: string): any => {
    const colors: Record<string, any> = {
      pending: 'outline',
      running: 'default',
      completed: 'outline',
      failed: 'destructive',
      cancelled: 'outline'
    };
    return colors[status] || 'outline';
  };

  const activePlaybooks = playbooks.filter(p => p.is_active).length;
  const automatedPlaybooks = playbooks.filter(p => p.automation_level === 'fully_automated').length;
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.was_successful).length;

  if (playbooksLoading) {
    return (
      <DashboardLayout>
        <div>Loading playbooks...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* SOC Navigation */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/soc')}>
          <Shield className="h-4 w-4 mr-2" />
          SOC Dashboard
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/alerts')}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Alerts
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/incidents')}>
          <FileWarning className="h-4 w-4 mr-2" />
          Incidents
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/threat-intel')}>
          <Database className="h-4 w-4 mr-2" />
          Threat Intel
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/security/playbooks')}>
          <FileText className="h-4 w-4 mr-2" />
          Playbooks
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/siem')}>
          <Activity className="h-4 w-4 mr-2" />
          SIEM
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/endpoint')}>
          <Shield className="h-4 w-4 mr-2" />
          EDR
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/email')}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Response Playbooks</h1>
          <p className="text-muted-foreground">Automated incident response workflows</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Playbooks</p>
              <p className="text-2xl font-bold">{activePlaybooks}</p>
            </div>
            <BookOpen className="h-8 w-8 text-secondary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Automated</p>
              <p className="text-2xl font-bold">{automatedPlaybooks}</p>
            </div>
            <Play className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Executions (30d)</p>
              <p className="text-2xl font-bold">{totalExecutions}</p>
            </div>
            <Clock className="h-8 w-8 text-secondary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Playbooks List */}
      <div className="grid gap-4">
        {playbooks.map((playbook) => {
          const playbookExecutions = executions.filter(e => e.playbook_id === playbook.id);
          const recentExecutions = playbookExecutions.slice(0, 3);

          return (
            <Card key={playbook.id} className="p-6 hover:bg-accent cursor-pointer" onClick={() => setSelectedPlaybook(playbook)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(playbook.playbook_type)}
                    <h3 className="font-semibold text-lg">{playbook.playbook_name}</h3>
                    <Badge variant={playbook.is_active ? 'default' : 'outline'}>
                      {playbook.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant={getAutomationColor(playbook.automation_level)}>
                      {playbook.automation_level.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{playbook.playbook_type}</Badge>
                  </div>
                  {playbook.description && (
                    <p className="text-sm text-muted-foreground mb-3">{playbook.description}</p>
                  )}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Steps</p>
                      <p className="font-medium">{playbook.steps?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Duration</p>
                      <p className="font-medium">{playbook.estimated_duration_minutes || 0} min</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Usage Count</p>
                      <p className="font-medium">{playbook.usage_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-medium">{playbook.success_rate || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {recentExecutions.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-2">Recent Executions</p>
                  <div className="space-y-2">
                    {recentExecutions.map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={getExecutionStatus(execution.execution_status)} className="text-xs">
                            {execution.execution_status}
                          </Badge>
                          <span className="text-muted-foreground">
                            Step {execution.current_step}/{execution.total_steps}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {format(new Date(execution.created_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {playbooks.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No response playbooks configured.</p>
            <p className="text-sm text-muted-foreground">
              Playbooks automate incident response workflows for faster, consistent security operations.
            </p>
          </Card>
        )}
      </div>

      {/* Playbook Details Dialog */}
      <Dialog open={!!selectedPlaybook} onOpenChange={() => setSelectedPlaybook(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlaybook && getTypeIcon(selectedPlaybook.playbook_type)}
              {selectedPlaybook?.playbook_name}
            </DialogTitle>
          </DialogHeader>

          {selectedPlaybook && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Type</p>
                  <p className="text-sm">{selectedPlaybook.playbook_type}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Automation Level</p>
                  <p className="text-sm">{selectedPlaybook.automation_level}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Total Steps</p>
                  <p className="text-sm">{selectedPlaybook.steps?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Estimated Duration</p>
                  <p className="text-sm">{selectedPlaybook.estimated_duration_minutes || 0} minutes</p>
                </div>
              </div>

              {selectedPlaybook.description && (
                <div>
                  <p className="text-sm font-semibold mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedPlaybook.description}</p>
                </div>
              )}

              {selectedPlaybook.steps && selectedPlaybook.steps.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Playbook Steps</p>
                  <div className="space-y-3">
                    {selectedPlaybook.steps.map((step: any, idx: number) => (
                      <Card key={idx} className="p-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{step.name || step.action}</p>
                            {step.description && (
                              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlaybook.trigger_conditions && (
                <div>
                  <p className="text-sm font-semibold mb-2">Trigger Conditions</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedPlaybook.trigger_conditions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}