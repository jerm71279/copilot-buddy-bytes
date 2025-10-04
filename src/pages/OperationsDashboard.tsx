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
import { useDemoMode } from "@/hooks/useDemoMode";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { WorkflowExecutionHistory } from "@/components/WorkflowExecutionHistory";
import { WorkflowTriggerManager } from "@/components/WorkflowTriggerManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardNavigation from "@/components/DashboardNavigation";
import MCPServerStatus from "@/components/MCPServerStatus";

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
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
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "operations" });
      await fetchStats();
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

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
    if (isPreviewMode) {
      navigate("/demo");
      return;
    }
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
            {isPreviewMode && <Badge variant="outline">Preview Mode</Badge>}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              {isPreviewMode ? "Back to Demos" : "Sign Out"}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <DashboardNavigation title="Operations Dashboard" />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              console.log("🔗 Navigating to workflow detail:", { metric: "Workflow Efficiency", department: "operations" });
              navigate(`/workflow/efficiency?metric=Workflow Efficiency&department=operations`);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflow Efficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.efficiency}%</div>
              <Progress value={stats.efficiency} className="mt-2" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/active?metric=Active Workflows&department=operations`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workflows}</div>
              <p className="text-xs text-muted-foreground mt-1">Cross-system</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/insights?metric=ML Insights&department=operations`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ML Insights</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mlInsights}</div>
              <Badge variant="outline" className="mt-1">AI-Powered</Badge>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/bottlenecks?metric=Bottlenecks&department=operations`)}
          >
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

        <Tabs defaultValue="workflows" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workflows">Workflow Builder</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            <WorkflowBuilder customerId={userProfile?.customer_id || "demo-customer"} />
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4">
            <WorkflowTriggerManager customerId={userProfile?.customer_id || "demo-customer"} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <WorkflowExecutionHistory customerId={userProfile?.customer_id || "demo-customer"} />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-4">
            <MCPServerStatus filterByServerType="operations" />
            
            <DepartmentAIAssistant 
              department="operations" 
              departmentLabel="Operations" 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OperationsDashboard;
