import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, CheckCircle, Shield, Users, FileText, Activity, FileWarning, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface SecurityIncident {
  id: string;
  customer_id: string;
  incident_number: string;
  incident_name: string;
  incident_type: string;
  severity: string;
  status: string;
  priority: string;
  description: string;
  initial_detection_time: string;
  containment_time?: string;
  eradication_time?: string;
  recovery_time?: string;
  closed_time?: string;
  affected_systems?: string[];
  affected_users?: string[];
  attack_vector?: string;
  root_cause?: string;
  impact_assessment?: string;
  lessons_learned?: string;
  reported_by?: string;
  assigned_to?: string;
  incident_commander?: string;
  created_at: string;
  updated_at: string;
}

export default function SecurityIncidents() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [newIncident, setNewIncident] = useState({
    incident_name: "",
    incident_type: "unauthorized_access",
    severity: "medium",
    description: ""
  });

  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery<SecurityIncident[]>({
    queryKey: ['security-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_incidents' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as SecurityIncident[];
    }
  });

  const createIncident = useMutation({
    mutationFn: async (incident: any) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.user?.id)
        .single();

      const { error } = await supabase
        .from('security_incidents' as any)
        .insert({
          ...incident,
          customer_id: profile?.customer_id,
          initial_detection_time: new Date().toISOString(),
          reported_by: user.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-incidents'] });
      setShowCreateDialog(false);
      setNewIncident({
        incident_name: "",
        incident_type: "unauthorized_access",
        severity: "medium",
        description: ""
      });
      toast({ title: "Incident created successfully" });
    }
  });

  const updateIncidentStatus = useMutation({
    mutationFn: async ({ id, status, timestamp }: { id: string; status: string; timestamp: string }) => {
      const updates: any = { status };
      
      if (status === 'contained') updates.containment_time = new Date().toISOString();
      if (status === 'eradicated') updates.eradication_time = new Date().toISOString();
      if (status === 'recovery') updates.recovery_time = new Date().toISOString();
      if (status === 'closed') updates.closed_time = new Date().toISOString();

      const { error } = await supabase
        .from('security_incidents' as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-incidents'] });
      toast({ title: "Status updated" });
    }
  });

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'text-destructive',
      high: 'text-warning',
      medium: 'text-warning',
      low: 'text-secondary'
    };
    return colors[severity] || 'text-muted-foreground';
  };

  const getStatusColor = (status: string): any => {
    const colors: Record<string, any> = {
      new: 'destructive',
      investigating: 'default',
      contained: 'secondary',
      eradicated: 'outline',
      recovery: 'outline',
      closed: 'outline'
    };
    return colors[status] || 'default';
  };

  const filterByStatus = (status?: string) => {
    if (!status) return incidents;
    return incidents.filter(i => i.status === status);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="h-4 w-4" />;
      case 'investigating': return <Clock className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading incidents...</div>;
  }

  return (
    <div className="p-8 space-y-6">
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
        <Button variant="ghost" size="sm" onClick={() => navigate('/security/incidents')}>
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
          <h1 className="text-3xl font-bold">Security Incidents</h1>
          <p className="text-muted-foreground">Incident response and lifecycle management</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Create Incident
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Incidents</p>
              <p className="text-2xl font-bold">{incidents.length}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">
                {incidents.filter(i => !['closed', 'eradicated'].includes(i.status)).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold">
                {incidents.filter(i => i.severity === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Closed</p>
              <p className="text-2xl font-bold">
                {incidents.filter(i => i.status === 'closed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
        </Card>
      </div>

      {/* Incidents List */}
      <Card className="p-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({incidents.length})</TabsTrigger>
            <TabsTrigger value="new">New ({filterByStatus('new').length})</TabsTrigger>
            <TabsTrigger value="investigating">Investigating ({filterByStatus('investigating').length})</TabsTrigger>
            <TabsTrigger value="contained">Contained ({filterByStatus('contained').length})</TabsTrigger>
          </TabsList>

          {['all', 'new', 'investigating', 'contained'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4 mt-4">
              {filterByStatus(status === 'all' ? undefined : status).map((incident) => (
                <Card key={incident.id} className="p-4 hover:bg-accent cursor-pointer" onClick={() => setSelectedIncident(incident)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(incident.status)}
                        <h3 className="font-semibold">{incident.incident_name}</h3>
                        <Badge variant={getStatusColor(incident.status)}>{incident.status}</Badge>
                        <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                        <Badge variant="outline">{incident.incident_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {incident.incident_number} • Detected: {format(new Date(incident.initial_detection_time), 'MMM dd, yyyy HH:mm')}
                      </p>
                      <p className="text-sm">{incident.description}</p>
                      {incident.affected_systems && incident.affected_systems.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            Affected Systems: {incident.affected_systems.slice(0, 3).join(', ')}
                            {incident.affected_systems.length > 3 && ` +${incident.affected_systems.length - 3} more`}
                          </p>
                        </div>
                      )}
                    </div>
                    {incident.status !== 'closed' && (
                      <div className="flex gap-2">
                        <Select
                          value={incident.status}
                          onValueChange={(value) => {
                            updateIncidentStatus.mutate({
                              id: incident.id,
                              status: value,
                              timestamp: new Date().toISOString()
                            });
                          }}
                        >
                          <SelectTrigger className="w-[180px]" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="contained">Contained</SelectItem>
                            <SelectItem value="eradicated">Eradicated</SelectItem>
                            <SelectItem value="recovery">Recovery</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Create Incident Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Security Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Incident Name</Label>
              <Input
                value={newIncident.incident_name}
                onChange={(e) => setNewIncident({ ...newIncident, incident_name: e.target.value })}
                placeholder="Brief incident description"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={newIncident.incident_type}
                onValueChange={(value) => setNewIncident({ ...newIncident, incident_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_breach">Data Breach</SelectItem>
                  <SelectItem value="malware">Malware</SelectItem>
                  <SelectItem value="dos">Denial of Service</SelectItem>
                  <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                  <SelectItem value="insider_threat">Insider Threat</SelectItem>
                  <SelectItem value="phishing">Phishing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select
                value={newIncident.severity}
                onValueChange={(value) => setNewIncident({ ...newIncident, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="Detailed incident description"
                rows={4}
              />
            </div>
            <Button
              onClick={() => createIncident.mutate(newIncident)}
              disabled={!newIncident.incident_name || !newIncident.description}
              className="w-full"
            >
              Create Incident
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Incident Details Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIncident && getStatusIcon(selectedIncident.status)}
              {selectedIncident?.incident_name}
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Incident Number</p>
                  <p className="text-sm">{selectedIncident.incident_number}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Status</p>
                  <Badge variant={getStatusColor(selectedIncident.status)}>{selectedIncident.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">Severity</p>
                  <Badge className={getSeverityColor(selectedIncident.severity)}>{selectedIncident.severity}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">Type</p>
                  <p className="text-sm">{selectedIncident.incident_type}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Detection Time</p>
                  <p className="text-sm">{format(new Date(selectedIncident.initial_detection_time), 'PPpp')}</p>
                </div>
                {selectedIncident.containment_time && (
                  <div>
                    <p className="text-sm font-semibold">Containment Time</p>
                    <p className="text-sm">{format(new Date(selectedIncident.containment_time), 'PPpp')}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Description</p>
                <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
              </div>

              {selectedIncident.affected_systems && selectedIncident.affected_systems.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Affected Systems</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.affected_systems.map((system, idx) => (
                      <Badge key={idx} variant="destructive">{system}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedIncident.root_cause && (
                <div>
                  <p className="text-sm font-semibold mb-2">Root Cause</p>
                  <p className="text-sm text-muted-foreground">{selectedIncident.root_cause}</p>
                </div>
              )}

              {selectedIncident.lessons_learned && (
                <div>
                  <p className="text-sm font-semibold mb-2">Lessons Learned</p>
                  <p className="text-sm text-muted-foreground">{selectedIncident.lessons_learned}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}