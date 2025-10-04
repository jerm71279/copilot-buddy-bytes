import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Shield, 
  Zap,
  Brain,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const AnalyticsPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>({});
  const [insights, setInsights] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's customer_id
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.customer_id) return;

      // Load ML insights
      const { data: mlInsights } = await supabase
        .from("ml_insights")
        .select("*")
        .eq("customer_id", profile.customer_id)
        .order("created_at", { ascending: false })
        .limit(5);

      setInsights(mlInsights || []);

      // Load anomalies
      const { data: anomalyData } = await supabase
        .from("anomaly_detections")
        .select("*")
        .eq("customer_id", profile.customer_id)
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(5);

      setAnomalies(anomalyData || []);

      // Load workflow metrics
      const { data: workflows } = await supabase
        .from("workflow_executions")
        .select("*")
        .eq("customer_id", profile.customer_id)
        .order("started_at", { ascending: false })
        .limit(100);

      const successRate = workflows
        ? ((workflows.filter(w => w.status === 'success').length / workflows.length) * 100).toFixed(1)
        : 0;

      setMetrics({
        totalWorkflows: workflows?.length || 0,
        successRate: successRate,
        activeInsights: mlInsights?.length || 0,
        activeAnomalies: anomalyData?.length || 0
      });

    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const analyticsDashboards = [
    { 
      name: "Executive Overview", 
      icon: BarChart3, 
      path: "/dashboard/executive", 
      description: "High-level business metrics and KPIs",
      color: "text-blue-500"
    },
    { 
      name: "Operations Analytics", 
      icon: Activity, 
      path: "/dashboard/operations", 
      description: "Workflow performance and efficiency metrics",
      color: "text-green-500"
    },
    { 
      name: "Compliance Dashboard", 
      icon: Shield, 
      path: "/dashboard/compliance", 
      description: "Compliance status and audit reports",
      color: "text-purple-500"
    },
    { 
      name: "IT Systems", 
      icon: Zap, 
      path: "/dashboard/it", 
      description: "System health and performance monitoring",
      color: "text-orange-500"
    },
    { 
      name: "HR Analytics", 
      icon: Activity, 
      path: "/dashboard/hr", 
      description: "Workforce metrics and insights",
      color: "text-pink-500"
    },
    { 
      name: "Finance Analytics", 
      icon: TrendingUp, 
      path: "/dashboard/finance", 
      description: "Financial performance and trends",
      color: "text-emerald-500"
    },
    { 
      name: "Sales Analytics", 
      icon: BarChart3, 
      path: "/dashboard/sales", 
      description: "Sales metrics and pipeline insights",
      color: "text-cyan-500"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Analytics & Insights Portal</h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered business intelligence and automation insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/portal">
                <Button variant="outline">Employee Portal</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Key Metrics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalWorkflows}</div>
                <p className="text-xs text-muted-foreground">Last 100 executions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.successRate}%</div>
                <p className="text-xs text-muted-foreground">Workflow success rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
                <Brain className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeInsights}</div>
                <p className="text-xs text-muted-foreground">Active recommendations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeAnomalies}</div>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Insights & Anomalies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Recent AI Insights</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* ML Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Machine Learning Insights
                </CardTitle>
                <CardDescription>AI-generated recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent insights</p>
                ) : (
                  <div className="space-y-3">
                    {insights.slice(0, 3).map((insight) => (
                      <div
                        key={insight.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <TrendingUp className="h-4 w-4 mt-1 text-purple-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{insight.insight_type}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {insight.description}
                          </p>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {(insight.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anomalies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Detected Anomalies
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {anomalies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active anomalies</p>
                ) : (
                  <div className="space-y-3">
                    {anomalies.slice(0, 3).map((anomaly) => (
                      <div
                        key={anomaly.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <AlertTriangle className="h-4 w-4 mt-1 text-orange-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{anomaly.anomaly_type}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {anomaly.description}
                          </p>
                          <Badge 
                            variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}
                            className="mt-2 text-xs"
                          >
                            {anomaly.severity} severity
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Analytics Dashboards */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Detailed Analytics Dashboards</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyticsDashboards.map((dashboard) => (
              <Link key={dashboard.name} to={dashboard.path}>
                <Card className="hover:shadow-lg transition-all hover:border-primary cursor-pointer h-full group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <dashboard.icon className={`h-6 w-6 ${dashboard.color}`} />
                        </div>
                        <CardTitle className="text-base">{dashboard.name}</CardTitle>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {dashboard.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPortal;
