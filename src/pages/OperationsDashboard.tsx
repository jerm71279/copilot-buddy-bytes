import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LogOut, TrendingUp, Workflow, AlertTriangle, Lightbulb } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    workflows: 0,
    mlInsights: 0,
    efficiency: 87,
    bottlenecks: 3
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
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

    if (!profile || profile.department !== "operations") {
      toast.error("Access denied: Operations department access required");
      navigate("/");
      return;
    }

    setUserProfile(profile);
    await fetchStats();
    setIsLoading(false);
  };

  const fetchStats = async () => {
    const [workflows, insights] = await Promise.all([
      supabase.from("workflows").select("*", { count: "exact", head: true }),
      supabase.from("ml_insights").select("*", { count: "exact", head: true })
    ]);

    setStats({
      workflows: workflows.count || 0,
      mlInsights: insights.count || 0,
      efficiency: 87,
      bottlenecks: 3
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Operations Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userProfile?.full_name}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflow Efficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.efficiency}%</div>
              <Progress value={stats.efficiency} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workflows}</div>
              <p className="text-xs text-muted-foreground mt-1">Cross-system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ML Insights</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mlInsights}</div>
              <Badge variant="outline" className="mt-1">AI-Powered</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bottlenecks}</div>
              <p className="text-xs text-muted-foreground mt-1">Detected</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cross-System Workflow Efficiency</CardTitle>
            <CardDescription>Performance metrics across integrated systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Employee Onboarding</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">2.3 days avg</span>
                  <Badge variant="outline">92% efficiency</Badge>
                </div>
              </div>
              <Progress value={92} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Compliance Approval</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">4.1 hours avg</span>
                  <Badge variant="outline">85% efficiency</Badge>
                </div>
              </div>
              <Progress value={85} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Access Provisioning</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">1.2 hours avg</span>
                  <Badge variant="destructive">Issue Detected</Badge>
                </div>
              </div>
              <Progress value={65} className="bg-destructive/20" />
            </div>
          </CardContent>
        </Card>

        <DepartmentAIAssistant 
          department="operations" 
          departmentLabel="Operations" 
        />
      </div>
    </div>
  );
};

export default OperationsDashboard;
