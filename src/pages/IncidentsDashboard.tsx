import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IncidentsService, NewIncidentInput } from "@/services/incidentsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Clock, Play } from "lucide-react";
import IncidentEvidenceUpload from "@/components/IncidentEvidenceUpload";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import MCPServerStatus from "@/components/MCPServerStatus";

export default function IncidentsDashboard() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newIncident, setNewIncident] = useState<NewIncidentInput>({
    title: "",
    description: "",
    severity: "medium",
    incident_type: "operational",
    detection_method: "manual"
  });

  const { data: incidents, isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => IncidentsService.getIncidents(),
  });

  const createIncident = useMutation({
    mutationFn: (incident: NewIncidentInput) => IncidentsService.createIncident(incident),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident created successfully");
      setIsCreateOpen(false);
      setNewIncident({ title: "", description: "", severity: "medium", incident_type: "operational", detection_method: "manual" });
    },
  });

  const triggerRemediation = useMutation({
    mutationFn: (incidentId: string) => IncidentsService.triggerRemediation(incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Remediation triggered successfully");
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "investigating": return <Clock className="h-4 w-4 text-warning" />;
      case "resolved": return <CheckCircle className="h-4 w-4 text-success" />;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading incidents...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8 space-y-6" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Incidents Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage system incidents</p>
          </div>
          <DashboardSettingsMenu dashboardName="Incidents" />
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Incident</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Incident Type</Label>
                <Select
                  value={newIncident.incident_type}
                  onValueChange={(value: any) => setNewIncident({ ...newIncident, incident_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select
                  value={newIncident.severity}
                  onValueChange={(value: any) => setNewIncident({ ...newIncident, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createIncident.mutate(newIncident)} className="w-full">
                Create Incident
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Open</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{incidents?.filter(i => i.status === "open").length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Investigating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{incidents?.filter(i => i.status === "investigating").length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{incidents?.filter(i => i.status === "resolved").length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              {incidents?.filter(i => i.severity === "critical").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>System incidents and auto-remediation status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents?.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-mono text-sm">{incident.incident_number}</TableCell>
                  <TableCell>{incident.title}</TableCell>
                  <TableCell className="capitalize">{incident.incident_type.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(incident.status)}
                      <span className="capitalize">{incident.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(incident.detected_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <IncidentEvidenceUpload
                        incidentId={incident.id}
                        incidentNumber={incident.incident_number}
                        onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ["incidents"] })}
                      />
                      {incident.status !== "resolved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerRemediation.mutate(incident.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Remediate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <DepartmentAIAssistant department="incidents" departmentLabel="Incident Management" />
        <MCPServerStatus filterByServerType="incidents" />
      </div>
      </div>
    </div>
  );
}
