import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Activity, Database, FileText, CheckCircle2, AlertTriangle, Zap, Users, Eye, FileWarning } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { toast } from "sonner";
import MCPServerStatus from "@/components/MCPServerStatus";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { useSecurityData } from "@/hooks/useSecurityData";
import { SecurityMetricCard } from "@/components/security/SecurityMetricCard";
import { SecurityIncidentsList } from "@/components/security/SecurityIncidentsList";
import { 
  primarySecurityMetrics, 
  secondarySecurityMetrics, 
  advancedSecurityMetrics,
  threatDetectionMetrics,
  getSeverityColor,
  getStatusColor
} from "@/lib/securityConfig";

interface ThreatAnalysis {
  analysis: string;
  securityContext: any;
  timestamp: string;
}

const SOCDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const { metrics, incidents, anomalies, isLoading: dataLoading } = useSecurityData();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
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
    setIsLoading(false);
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
    // Don't allow in preview mode
    if (isPreviewMode) {
      toast.error("Threat analysis requires authentication. Please sign in.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Verify user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to run threat analysis");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('soc-threat-analysis', {
        body: { analysisType: 'comprehensive', timeframe: selectedTimeframe },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Function response error:', data.error);
        toast.error(data.error || "Failed to run threat analysis");
        return;
      }

      setThreatAnalysis(data);
      toast.success("Threat analysis complete");
      setActiveTab("ai-analysis");
    } catch (error: any) {
      console.error('Threat analysis error:', error);
      const errorMessage = error?.message || error?.error || "Failed to run threat analysis";
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
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
        
        {/* Primary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {primarySecurityMetrics.map(config => (
            <SecurityMetricCard 
              key={config.id}
              config={config}
              metrics={metrics}
              navigate={navigate}
              showProgress={config.id === 'compliance-score'}
            />
          ))}
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          {secondarySecurityMetrics.map(config => {
            const Icon = config.icon;
            const value = config.getValue(metrics);
            return (
              <Card key={config.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{config.title}</p>
                      <p className={`text-2xl font-bold mt-1 ${config.className || ''}`}>{value}</p>
                    </div>
                    <Icon className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Advanced Security Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          {advancedSecurityMetrics.map(config => {
            const Icon = config.icon;
            const value = config.getValue(metrics);
            return (
              <Card key={config.id} className="border-warning/20 bg-warning/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{config.title}</p>
                      <p className={`text-2xl font-bold mt-1 ${config.className || ''}`}>{value}</p>
                    </div>
                    <Icon className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs for Different Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            <TabsTrigger value="ai-analysis">🤖 AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Incidents</CardTitle>
                <CardDescription>Real-time security event monitoring and response</CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityIncidentsList incidents={incidents} />
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
                            anomaly.severity === "critical" ? "bg-destructive/10" : 
                            anomaly.severity === "high" ? "bg-warning/10" : "bg-warning/5"
                          }`}>
                            <FileWarning className={`h-5 w-5 ${
                              anomaly.severity === "critical" ? "text-destructive" : 
                              anomaly.severity === "high" ? "text-warning" : "text-warning"
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

          <TabsContent value="ai-analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  AI Threat Analysis
                </CardTitle>
                <CardDescription>
                  Comprehensive AI-powered security analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {threatAnalysis ? (
                  <div className="space-y-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p>{threatAnalysis.analysis}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Analysis performed at: {new Date(threatAnalysis.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No threat analysis available</p>
                    <Button onClick={runThreatAnalysis} disabled={isAnalyzing}>
                      {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Components */}
        <div className="grid gap-6 md:grid-cols-2">
          <DepartmentAIAssistant department="security" departmentLabel="Security Operations" />
          <MCPServerStatus filterByServerType="security" />
        </div>
      </main>
    </div>
  );
};

export default SOCDashboard;
