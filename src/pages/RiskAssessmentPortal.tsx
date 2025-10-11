import { useState } from "react";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RiskAssessmentDialog } from "@/components/RiskAssessmentDialog";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  FileText,
  Target,
  Activity,
  Plus,
  ExternalLink
} from "lucide-react";

const RiskAssessmentPortal = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("register");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch risk assessments
  const { data: risks, isLoading: risksLoading, refetch: refetchRisks } = useQuery({
    queryKey: ["risk-assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_assessments")
        .select("*")
        .order("inherent_score", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch risk controls
  const { data: controls, isLoading: controlsLoading } = useQuery({
    queryKey: ["risk-controls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_controls")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch risk treatments
  const { data: treatments, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["risk-treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_treatments")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const stats = {
    totalRisks: risks?.length || 0,
    criticalRisks: risks?.filter(r => r.inherent_score >= 15).length || 0,
    highRisks: risks?.filter(r => r.inherent_score >= 10 && r.inherent_score < 15).length || 0,
    mediumRisks: risks?.filter(r => r.inherent_score >= 6 && r.inherent_score < 10).length || 0,
    lowRisks: risks?.filter(r => r.inherent_score < 6).length || 0,
    treatedRisks: risks?.filter(r => r.status === 'treated' || r.status === 'monitored').length || 0,
    activeControls: controls?.filter(c => c.implementation_status === 'implemented' || c.implementation_status === 'verified').length || 0,
    pendingTreatments: treatments?.filter(t => t.status === 'pending' || t.status === 'in_progress').length || 0,
  };

  const getRiskLevelColor = (score: number) => {
    if (score >= 15) return "destructive";
    if (score >= 10) return "default";
    if (score >= 6) return "secondary";
    return "outline";
  };

  const getRiskLevelLabel = (score: number) => {
    if (score >= 15) return "Critical";
    if (score >= 10) return "High";
    if (score >= 6) return "Medium";
    return "Low";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cybersecurity': return <Shield className="h-4 w-4" />;
      case 'operational': return <Activity className="h-4 w-4" />;
      case 'compliance': return <FileText className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (risksLoading || controlsLoading || treatmentsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading risk data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <main className="container mx-auto px-4 py-8" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Risk Assessment Portal</h1>
            <p className="text-muted-foreground">
              Comprehensive CISSP-aligned risk management and assessment framework
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Risk Assessment
          </Button>
        </div>

        <RiskAssessmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => refetchRisks()}
        />

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Identified Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRisks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.criticalRisks} critical, {stats.highRisks} high priority
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Treatment Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRisks > 0 ? Math.round((stats.treatedRisks / stats.totalRisks) * 100) : 0}%
              </div>
              <Progress 
                value={stats.totalRisks > 0 ? (stats.treatedRisks / stats.totalRisks) * 100 : 0} 
                className="mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.treatedRisks} of {stats.totalRisks} risks treated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Controls</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeControls}</div>
              <p className="text-xs text-muted-foreground">
                {controls?.length || 0} total controls deployed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTreatments}</div>
              <p className="text-xs text-muted-foreground">
                Treatment actions in progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="register">Risk Register ({stats.totalRisks})</TabsTrigger>
            <TabsTrigger value="controls">Controls ({controls?.length || 0})</TabsTrigger>
            <TabsTrigger value="treatments">Treatments ({treatments?.length || 0})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Risk Register Tab */}
          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Register</CardTitle>
                <CardDescription>
                  Comprehensive inventory of identified organizational risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {risks && risks.length > 0 ? (
                  <div className="space-y-4">
                    {risks.map((risk) => (
                      <div key={risk.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(risk.category)}
                            <h3 className="font-semibold">{risk.risk_title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRiskLevelColor(risk.inherent_score)}>
                              {getRiskLevelLabel(risk.inherent_score)} ({risk.inherent_score})
                            </Badge>
                            <Badge variant="outline">{risk.status}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{risk.risk_description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>ID: {risk.risk_id}</span>
                          <span>Category: {risk.category}</span>
                          <span>Likelihood: {risk.inherent_likelihood}</span>
                          <span>Impact: {risk.inherent_impact}</span>
                          {risk.residual_score && (
                            <span className="text-green-600">
                              Residual: {risk.residual_score} (↓{risk.inherent_score - risk.residual_score})
                            </span>
                          )}
                        </div>
                        {risk.treatment_type && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Treatment: {risk.treatment_type}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Risks Identified</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by creating your first risk assessment
                    </p>
                    <Button onClick={() => toast({ title: "Coming Soon", description: "Risk creation wizard" })}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Risk
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Controls & Mitigations</CardTitle>
                <CardDescription>
                  Technical and administrative controls implemented to manage risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {controls && controls.length > 0 ? (
                  <div className="space-y-4">
                    {controls.map((control) => (
                      <div key={control.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{control.control_name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{control.control_description}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge variant={control.implementation_status === 'implemented' || control.implementation_status === 'verified' ? 'default' : 'secondary'}>
                              {control.implementation_status}
                            </Badge>
                            {control.effectiveness_rating && (
                              <Badge variant="outline">{control.effectiveness_rating}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <span>ID: {control.control_id}</span>
                          <span>Type: {control.control_type}</span>
                          {control.last_tested_date && (
                            <span>Last Tested: {new Date(control.last_tested_date).toLocaleDateString()}</span>
                          )}
                          {control.next_test_date && (
                            <span>Next Test: {new Date(control.next_test_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Controls Defined</h3>
                    <p className="text-muted-foreground">
                      Add controls to mitigate identified risks
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Treatment Actions</CardTitle>
                <CardDescription>
                  Active and planned risk mitigation activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {treatments && treatments.length > 0 ? (
                  <div className="space-y-4">
                    {treatments.map((treatment) => (
                      <div key={treatment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{treatment.treatment_action}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{treatment.treatment_description}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge variant={treatment.status === 'completed' ? 'default' : 'secondary'}>
                              {treatment.status}
                            </Badge>
                            <Badge variant={
                              treatment.priority === 'critical' ? 'destructive' :
                              treatment.priority === 'high' ? 'default' : 'outline'
                            }>
                              {treatment.priority}
                            </Badge>
                          </div>
                        </div>
                        {treatment.progress_percentage !== null && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{treatment.progress_percentage}%</span>
                            </div>
                            <Progress value={treatment.progress_percentage} />
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <span>Due: {new Date(treatment.due_date).toLocaleDateString()}</span>
                          {treatment.estimated_cost && (
                            <span>Est. Cost: ${treatment.estimated_cost.toLocaleString()}</span>
                          )}
                          {treatment.completed_date && (
                            <span className="text-green-600">
                              Completed: {new Date(treatment.completed_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Treatment Actions</h3>
                    <p className="text-muted-foreground">
                      Define treatment plans for identified risks
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                  <CardDescription>Breakdown by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Critical</span>
                        <span className="text-sm text-muted-foreground">{stats.criticalRisks}</span>
                      </div>
                      <Progress value={stats.totalRisks > 0 ? (stats.criticalRisks / stats.totalRisks) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">High</span>
                        <span className="text-sm text-muted-foreground">{stats.highRisks}</span>
                      </div>
                      <Progress value={stats.totalRisks > 0 ? (stats.highRisks / stats.totalRisks) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Medium</span>
                        <span className="text-sm text-muted-foreground">{stats.mediumRisks}</span>
                      </div>
                      <Progress value={stats.totalRisks > 0 ? (stats.mediumRisks / stats.totalRisks) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Low</span>
                        <span className="text-sm text-muted-foreground">{stats.lowRisks}</span>
                      </div>
                      <Progress value={stats.totalRisks > 0 ? (stats.lowRisks / stats.totalRisks) * 100 : 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Integration</CardTitle>
                  <CardDescription>Connected security systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Incidents</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = '/incidents'}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Compliance</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard/compliance'}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm font-medium">Change Management</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = '/change-management'}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm font-medium">SOC Dashboard</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard/soc'}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RiskAssessmentPortal;
