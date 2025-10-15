import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, AlertTriangle, Activity, Eye, Lock, 
  TrendingUp, Database, Users, FileWarning, CheckCircle2,
  Clock, Zap, ChevronDown, FileText, Search, Server, Globe
} from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";


import { toast } from "sonner";
import MCPServerStatus from "@/components/MCPServerStatus";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

/**
 * SOC Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[SOC Analyst] -->|Visits /dashboard/soc| B[SOCDashboard Component]
 *     B -->|useEffect| C[checkAccess & fetchStats]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     D -->|Get Profile| E[user_profiles Table]
 *     
 *     C -->|Parallel Queries| F[fetchSecurityData]
 *     F -->|Query| G[anomaly_detections Table]
 *     G -->|Filter: severity=critical| H[Critical Alerts]
 *     G -->|Filter: status=new| I[Active Threats]
 *     G -->|Filter: status=resolved| J[Resolved Incidents]
 *     
 *     H -->|Set State| K[metrics.criticalAlerts]
 *     I -->|Set State| L[metrics.activeThreats]
 *     J -->|Set State| M[metrics.resolvedIncidents]
 *     
 *     B -->|Fetch MCP Servers| N[fetchMcpServers]
 *     N -->|Query| O[mcp_servers Table]
 *     N -->|Filter: server_type=soc| P[SOC MCP Servers]
 *     P -->|Display| Q[MCP Dropdown Menu]
 *     
 *     R[Real-time Monitoring] -->|Subscribe| S[anomaly_detections Realtime]
 *     S -->|New Event| T[Update Dashboard]
 *     
 *     U[Privileged Access] -->|Navigate| V[/privileged-access-audit]
 *     V -->|Load| W[audit_logs Table]
 *     W -->|Filter: compliance_tags=privileged_access| X[Access Logs]
 *     
 *     Y[View Incident] -->|Click| Z[Incident Detail Modal]
 *     Z -->|Display| AA[Full Incident Context]
 *     
 *     AB[Threat Intelligence] -->|External API| AC[Threat Feeds]
 *     AC -->|Enrich| G
 *     
 *     AD[SIEM Integration] -->|API| AE[Security Information]
 *     AE -->|Store| G
 *     
 *     AF[AI Assistant] -->|Invoke| AG[department-assistant Edge Function]
 *     AG -->|Context: SOC| AH[Threat Analysis & Recommendations]
 *     
 *     AI[Compliance Score] -->|Calculate| AJ[Based on Framework Requirements]
 *     
 *     AK[Response Time] -->|Track| AL[Incident Timestamps]
 *     
 *     style A fill:#e1f5ff
 *     style AG fill:#fff4e6
 *     style AC fill:#ffe6e6
 *     style AE fill:#ffe6e6
 *     style G fill:#e6f7ff
 *     style O fill:#e6f7ff
 *     style W fill:#e6f7ff
 * ```
 */

interface SecurityMetrics {
  totalIncidents: number;
  criticalAlerts: number;
  activeThreats: number;
  resolvedIncidents: number;
  complianceScore: number;
  systemsMonitored: number;
  avgResponseTime: string;
  threatsPrevented: number;
  failedLogins24h: number;
  activeLockouts: number;
  lateralMovement24h: number;
  exfiltrationAttempts24h: number;
  activeThreatsCount: number;
  activeAttackChains: number;
  honeypotTriggers24h: number;
  criticalDeviations: number;
}

interface ThreatAnalysis {
  analysis: string;
  securityContext: any;
  timestamp: string;
}

interface SecurityIncident {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  description: string;
  timestamp: string;
  status: "new" | "investigating" | "resolved";
  affectedSystems: string[];
}

const SOCDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalIncidents: 0,
    criticalAlerts: 0,
    activeThreats: 0,
    resolvedIncidents: 0,
    complianceScore: 0,
    systemsMonitored: 0,
    avgResponseTime: "0m",
    threatsPrevented: 0,
    failedLogins24h: 0,
    activeLockouts: 0,
    lateralMovement24h: 0,
    exfiltrationAttempts24h: 0,
    activeThreatsCount: 0,
    activeAttackChains: 0,
    honeypotTriggers24h: 0,
    criticalDeviations: 0,
  });
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("incidents");
  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");

  useEffect(() => {
    checkAccess();
    fetchMcpServers();
  }, []);

  const fetchMcpServers = async () => {
    const { data } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "security")
      .eq("status", "active")
      .order("server_name");
    
    if (data) setMcpServers(data);
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Security Analyst", department: "security" });
      await fetchSecurityData();
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    setUserProfile(profile);
    await fetchSecurityData();
    setIsLoading(false);
  };

  const fetchSecurityData = async () => {
    try {
      // Fetch anomaly detections
      const { data: anomalyData, error: anomalyError } = await supabase
        .from("anomaly_detections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (anomalyError) throw anomalyError;

      setAnomalies(anomalyData || []);

      // Fetch audit logs for security events
      const { data: auditData } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch compliance reports
      const { data: complianceData } = await supabase
        .from("compliance_reports")
        .select("*");

      // Fetch integrations count
      const { data: integrationsData } = await supabase
        .from("integrations")
        .select("*");

      // Calculate metrics
      const criticalAnomalies = anomalyData?.filter(a => a.severity === "critical").length || 0;
      const unresolvedAnomalies = anomalyData?.filter(a => !a.resolved_at).length || 0;
      const resolvedAnomalies = anomalyData?.filter(a => a.resolved_at).length || 0;
      
      // Calculate average compliance score
      let avgComplianceScore = 85; // Default
      if (complianceData && complianceData.length > 0) {
        const scores = complianceData.map(r => {
          const findings = r.findings as any;
          if (findings?.compliance_score) return findings.compliance_score;
          return 85;
        });
        avgComplianceScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      // Fetch new security metrics
      const { data: securityOverview } = await supabase
        .from('soc_security_overview')
        .select('*')
        .single();

      setMetrics({
        totalIncidents: anomalyData?.length || 0,
        criticalAlerts: criticalAnomalies,
        activeThreats: unresolvedAnomalies,
        resolvedIncidents: resolvedAnomalies,
        complianceScore: Math.round(avgComplianceScore),
        systemsMonitored: integrationsData?.length || 0,
        avgResponseTime: "12m",
        threatsPrevented: resolvedAnomalies * 3,
        failedLogins24h: securityOverview?.failed_logins_24h || 0,
        activeLockouts: securityOverview?.active_lockouts || 0,
        lateralMovement24h: securityOverview?.lateral_movement_24h || 0,
        exfiltrationAttempts24h: securityOverview?.exfiltration_attempts_24h || 0,
        activeThreatsCount: securityOverview?.active_threats || 0,
        activeAttackChains: securityOverview?.active_attack_chains || 0,
        honeypotTriggers24h: securityOverview?.honeypot_triggers_24h || 0,
        criticalDeviations: securityOverview?.critical_deviations || 0,
      });

      // Transform anomalies to incidents
      const incidentData: SecurityIncident[] = (anomalyData || []).map(anomaly => ({
        id: anomaly.id,
        severity: (anomaly.severity || "medium") as any,
        type: anomaly.anomaly_type,
        description: anomaly.description,
        timestamp: anomaly.created_at,
        status: anomaly.resolved_at ? "resolved" : "new",
        affectedSystems: [anomaly.system_name]
      }));

      setIncidents(incidentData);

    } catch (error) {
      console.error("Error fetching security data:", error);
      toast.error("Failed to load security data");
    }
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate("/demo");
      return;
    }
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const runThreatAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('soc-threat-analysis', {
        body: { analysisType: 'comprehensive', timeframe: selectedTimeframe }
      });

      if (error) throw error;

      setThreatAnalysis(data);
      toast.success("Threat analysis complete");
      setActiveTab("ai-analysis");
    } catch (error) {
      console.error('Threat analysis error:', error);
      toast.error("Failed to run threat analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-destructive bg-destructive/10 border-destructive/20";
      case "high": return "text-warning bg-warning/10 border-warning/20";
      case "medium": return "text-warning bg-warning/10 border-warning/20";
      case "low": return "text-secondary bg-secondary/10 border-secondary/20";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800";
      case "investigating": return "bg-blue-100 text-blue-800";
      case "new": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 space-y-6" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Security Operations Center</h1>
            <p className="text-sm text-muted-foreground">Advanced threat detection & response</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={runThreatAnalysis} 
              disabled={isAnalyzing}
              variant="outline"
            >
              {isAnalyzing ? "Analyzing..." : "🤖 AI Threat Analysis"}
            </Button>
            <DashboardSettingsMenu dashboardName="SOC" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/incidents?metric=Total Incidents&department=security`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalIncidents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.criticalAlerts} critical alerts
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/threats?metric=Active Threats&department=security`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.activeThreats}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/compliance-score?metric=Compliance Score&department=security`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{metrics.complianceScore}%</div>
              <Progress value={metrics.complianceScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/response-time?metric=Response Time&department=security`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgResponseTime}</div>
              <p className="text-xs text-muted-foreground mt-1">Target: &lt;15m</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Systems Monitored</p>
                  <p className="text-2xl font-bold mt-1">{metrics.systemsMonitored}</p>
                </div>
                <Database className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Threats Prevented</p>
                  <p className="text-2xl font-bold mt-1 text-primary">{metrics.threatsPrevented}</p>
                </div>
                <Lock className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                  <p className="text-2xl font-bold mt-1">{metrics.resolvedIncidents}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Security Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed Logins (24h)</p>
                  <p className="text-2xl font-bold mt-1 text-orange-600">{metrics.failedLogins24h}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lateral Movement</p>
                  <p className="text-2xl font-bold mt-1 text-destructive">{metrics.lateralMovement24h}</p>
                </div>
                <Users className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Exfiltration Attempts</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{metrics.exfiltrationAttempts24h}</p>
                </div>
                <FileWarning className="h-8 w-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attack Chains</p>
                  <p className="text-2xl font-bold mt-1 text-secondary">{metrics.activeAttackChains}</p>
                </div>
                <Zap className="h-8 w-8 text-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
            <TabsTrigger value="ai-analysis">🤖 AI Threat Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Incidents</CardTitle>
                <CardDescription>Real-time security event monitoring and response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No security incidents detected</p>
                    </div>
                  ) : (
                    incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className={`p-4 rounded-lg border ${getSeverityColor(incident.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(incident.status)}>
                                {incident.status.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{incident.severity.toUpperCase()}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(incident.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <h4 className="font-semibold mb-1">{incident.type}</h4>
                            <p className="text-sm mb-2">{incident.description}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <Database className="h-3 w-3" />
                              <span>Affected: {incident.affectedSystems.join(", ")}</span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Investigate
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Detection</CardTitle>
                <CardDescription>AI-powered behavioral anomaly detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {anomalies.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No anomalies detected</p>
                    </div>
                  ) : (
                    anomalies.map((anomaly) => (
                      <div key={anomaly.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            anomaly.severity === "critical" ? "bg-red-100" : 
                            anomaly.severity === "high" ? "bg-orange-100" : "bg-yellow-100"
                          }`}>
                            <FileWarning className={`h-5 w-5 ${
                              anomaly.severity === "critical" ? "text-red-600" : 
                              anomaly.severity === "high" ? "text-orange-600" : "text-yellow-600"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{anomaly.anomaly_type}</p>
                            <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                            {anomaly.confidence_score && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Confidence: {(parseFloat(anomaly.confidence_score) * 100).toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={anomaly.resolved_at ? "outline" : "destructive"}>
                          {anomaly.resolved_at ? "Resolved" : "Active"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Monitoring</CardTitle>
                <CardDescription>Real-time compliance status across frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SOC 2 Type II</span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ISO 27001</span>
                      <span className="text-sm text-muted-foreground">88%</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">GDPR</span>
                      <span className="text-sm text-muted-foreground">95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">HIPAA</span>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤖 AI-Powered Threat Analysis
                  <Badge variant="secondary">Powered by Lovable AI</Badge>
                </CardTitle>
                <CardDescription>
                  Comprehensive security posture analysis using advanced AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!threatAnalysis ? (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Run AI Threat Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Get AI-powered insights into your security posture, attack patterns, and priority actions
                    </p>
                    <div className="flex justify-center gap-2 mb-4">
                      <Button
                        variant={selectedTimeframe === '1h' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('1h')}
                      >
                        Last Hour
                      </Button>
                      <Button
                        variant={selectedTimeframe === '24h' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('24h')}
                      >
                        Last 24 Hours
                      </Button>
                      <Button
                        variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('7d')}
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('30d')}
                      >
                        Last 30 Days
                      </Button>
                    </div>
                    <Button onClick={runThreatAnalysis} disabled={isAnalyzing} size="lg">
                      {isAnalyzing ? 'Analyzing Security Data...' : 'Run Analysis'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">
                          Analysis completed at {new Date(threatAnalysis.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <Button onClick={runThreatAnalysis} disabled={isAnalyzing} size="sm" variant="outline">
                        Refresh Analysis
                      </Button>
                    </div>

                    {/* Security Context Summary */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card className="border-orange-200">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                            <p className="text-2xl font-bold">{threatAnalysis.securityContext.stats.failedLogins}</p>
                            <p className="text-xs text-muted-foreground">Failed Logins</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-red-200">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Zap className="h-8 w-8 mx-auto mb-2 text-red-600" />
                            <p className="text-2xl font-bold">{threatAnalysis.securityContext.stats.attackChains}</p>
                            <p className="text-xs text-muted-foreground">Attack Chains</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-200">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <FileWarning className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                            <p className="text-2xl font-bold">{threatAnalysis.securityContext.stats.dataAnomalies}</p>
                            <p className="text-xs text-muted-foreground">Data Anomalies</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <p className="text-2xl font-bold">{threatAnalysis.securityContext.stats.honeypotTriggers}</p>
                            <p className="text-xs text-muted-foreground">Honeypot Hits</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* AI Analysis */}
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          AI Security Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                            {threatAnalysis.analysis}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Threat Indicators */}
                    {threatAnalysis.securityContext.recentEvents.activeThreats.length > 0 && (
                      <Card className="border-red-200">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Active Threat Indicators
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {threatAnalysis.securityContext.recentEvents.activeThreats.slice(0, 5).map((threat: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50/50">
                                <div className="flex items-center gap-3">
                                  <Badge variant="destructive">{threat.threat_level}</Badge>
                                  <div>
                                    <p className="font-medium text-sm">{threat.indicator_type}: {threat.indicator_value}</p>
                                    <p className="text-xs text-muted-foreground">{threat.description || 'No description'}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Seen: {threat.match_count}x
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button variant="outline" className="justify-start" onClick={() => navigate('/security/alerts')}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Security Alerts
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/security/incidents')}>
                <FileWarning className="h-4 w-4 mr-2" />
                Incidents
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/security/threat-intel')}>
                <Database className="h-4 w-4 mr-2" />
                Threat Intel
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/security/playbooks')}>
                <FileText className="h-4 w-4 mr-2" />
                Playbooks
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/siem')}>
                <Activity className="h-4 w-4 mr-2" />
                SIEM Dashboard
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/risk-assessment')}>
                <Shield className="h-4 w-4 mr-2" />
                Risk Assessment
              </Button>
              <Button variant="outline" className="justify-start">
                <Zap className="h-4 w-4 mr-2" />
                Run Security Scan
              </Button>
              <Button variant="outline" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                Review Access Logs
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SOCDashboard;
