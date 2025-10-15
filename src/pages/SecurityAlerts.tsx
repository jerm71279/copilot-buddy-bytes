import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Shield, CheckCircle, XCircle, Clock, TrendingUp, Activity, FileWarning, Database, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// Manual type definitions until Supabase types regenerate
interface SecurityAlert {
  id: string;
  customer_id: string;
  alert_id: string;
  alert_name: string;
  alert_type: string;
  severity: string;
  status: string;
  source_system: string;
  detection_method: string;
  affected_entities: any;
  indicators: any[];
  confidence_score: number;
  raw_log: any;
  alert_details: any;
  assigned_to?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  incident_id?: string;
  playbook_id?: string;
  response_actions: any;
  compliance_tags: string[];
  created_at: string;
  updated_at: string;
}

interface SOCMetrics {
  customer_id: string;
  alerts_24h: number;
  alerts_7d: number;
  open_alerts: number;
  critical_open: number;
  avg_acknowledgment_time_minutes: number;
  avg_resolution_time_minutes: number;
  active_incidents: number;
  critical_incidents: number;
  active_threat_indicators: number;
  running_playbooks: number;
}

export default function SecurityAlerts() {
  const navigate = useNavigate();
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery<SecurityAlert[]>({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as SecurityAlert[];
    }
  });

  const { data: metrics } = useQuery<SOCMetrics>({
    queryKey: ['soc-metrics'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.user.id)
        .single();

      const { data, error } = await supabase
        .from('soc_metrics_dashboard' as any)
        .select('*')
        .eq('customer_id', profile?.customer_id)
        .maybeSingle();
      
      if (error) throw error;
      return (data || {}) as unknown as SOCMetrics;
    }
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('security_alerts' as any)
        .update({
          status: 'acknowledged',
          acknowledged_by: user.user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      toast({ title: "Alert acknowledged" });
    }
  });

  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('security_alerts' as any)
        .update({
          status: 'resolved',
          resolved_by: user.user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      setSelectedAlert(null);
      setResolutionNotes("");
      toast({ title: "Alert resolved" });
    }
  });

  const escalateToIncident = useMutation({
    mutationFn: async (alertId: string) => {
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) throw new Error('Alert not found');
      
      const { data: user } = await supabase.auth.getUser();
      
      const { data: incident, error: incidentError } = await supabase
        .from('security_incidents' as any)
        .insert({
          customer_id: alert.customer_id,
          incident_name: `Escalated: ${alert.alert_name}`,
          incident_type: alert.alert_type,
          severity: alert.severity,
          description: `Alert ${alert.alert_id} escalated to incident`,
          initial_detection_time: alert.created_at,
          related_alerts: [alertId],
          reported_by: user.user?.id
        })
        .select()
        .maybeSingle();

      if (incidentError) throw incidentError;
      if (!incident) throw new Error('Failed to create incident');

      const incidentData = incident as any;
      const { error: updateError } = await supabase
        .from('security_alerts' as any)
        .update({
          status: 'escalated',
          incident_id: incidentData.id
        })
        .eq('id', alertId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      toast({ title: "Alert escalated to incident" });
    }
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'medium': return <Shield className="h-4 w-4 text-warning" />;
      default: return <Shield className="h-4 w-4 text-secondary" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'destructive',
      acknowledged: 'default',
      investigating: 'secondary',
      resolved: 'outline',
      false_positive: 'outline',
      escalated: 'destructive'
    };
    return colors[status] || 'default';
  };

  const filterByStatus = (status?: string) => {
    if (!status) return alerts;
    return alerts.filter(a => a.status === status);
  };

  if (isLoading) {
    return <div className="p-8">Loading alerts...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* SOC Navigation */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/soc')}>
          <Shield className="h-4 w-4 mr-2" />
          SOC Dashboard
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/security/alerts')}>
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
        <Button variant="outline" size="sm" onClick={() => navigate('/security/playbooks')}>
          <FileText className="h-4 w-4 mr-2" />
          Playbooks
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/siem')}>
          <Activity className="h-4 w-4 mr-2" />
          SIEM
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security Alerts</h1>
          <p className="text-muted-foreground">Real-time security event monitoring and response</p>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alerts (24h)</p>
              <p className="text-2xl font-bold">{metrics?.alerts_24h || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-secondary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Alerts</p>
              <p className="text-2xl font-bold">{metrics?.open_alerts || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Open</p>
              <p className="text-2xl font-bold">{metrics?.critical_open || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Resolution</p>
              <p className="text-2xl font-bold">
                {Math.round(metrics?.avg_resolution_time_minutes || 0)}m
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="p-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({alerts.length})</TabsTrigger>
            <TabsTrigger value="new">New ({filterByStatus('new').length})</TabsTrigger>
            <TabsTrigger value="acknowledged">Acknowledged ({filterByStatus('acknowledged').length})</TabsTrigger>
            <TabsTrigger value="investigating">Investigating ({filterByStatus('investigating').length})</TabsTrigger>
          </TabsList>

          {['all', 'new', 'acknowledged', 'investigating'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4 mt-4">
              {filterByStatus(status === 'all' ? undefined : status).map((alert) => (
                <Card key={alert.id} className="p-4 hover:bg-accent cursor-pointer" onClick={() => setSelectedAlert(alert)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(alert.severity)}
                        <h3 className="font-semibold">{alert.alert_name}</h3>
                        <Badge variant={getStatusColor(alert.status) as any}>{alert.status}</Badge>
                        <Badge>{alert.alert_type}</Badge>
                        {alert.confidence_score && (
                          <Badge variant="outline">{alert.confidence_score}% confidence</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.alert_id} • {format(new Date(alert.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {alert.indicators && alert.indicators.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {alert.indicators.slice(0, 3).map((ind: any, idx: number) => (
                            <Badge key={idx} variant="destructive">
                              {ind.indicator_type}: {ind.indicator_value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {alert.status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeAlert.mutate(alert.id);
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          escalateToIncident.mutate(alert.id);
                        }}
                      >
                        Escalate
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getSeverityIcon(selectedAlert.severity)}
              {selectedAlert?.alert_name}
            </DialogTitle>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Alert ID</p>
                  <p className="text-sm">{selectedAlert.alert_id}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Status</p>
                  <Badge variant={getStatusColor(selectedAlert.status) as any}>{selectedAlert.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">Severity</p>
                  <Badge>{selectedAlert.severity}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">Detection Method</p>
                  <p className="text-sm">{selectedAlert.detection_method}</p>
                </div>
              </div>

              {selectedAlert.affected_entities && (
                <div>
                  <p className="text-sm font-semibold mb-2">Affected Entities</p>
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(selectedAlert.affected_entities, null, 2)}
                  </pre>
                </div>
              )}

              {selectedAlert.status !== 'resolved' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Resolution Notes</label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter resolution notes..."
                    rows={4}
                  />
                  <Button
                    onClick={() => resolveAlert.mutate({ alertId: selectedAlert.id, notes: resolutionNotes })}
                    disabled={!resolutionNotes}
                  >
                    Resolve Alert
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}