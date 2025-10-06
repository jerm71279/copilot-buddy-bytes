import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LogOut, TrendingUp, Workflow, AlertTriangle, Lightbulb, ChevronDown, FileText, Settings, GitBranch, Server } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useDemoMode } from "@/hooks/useDemoMode";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { WorkflowExecutionHistory } from "@/components/WorkflowExecutionHistory";
import { WorkflowTriggerManager } from "@/components/WorkflowTriggerManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardNavigation from "@/components/DashboardNavigation";
import MCPServerStatus from "@/components/MCPServerStatus";
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
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
    fetchMcpServers();
  }, []);

  const fetchMcpServers = async () => {
    const { data } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "operations")
      .eq("status", "active")
      .order("server_name");
    
    if (data) setMcpServers(data);
  };

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
        <DashboardNavigation 
          title="Operations Dashboard"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics" },
            { name: "Compliance Portal", path: "/compliance" },
            { name: "Executive Dashboard", path: "/dashboard/executive" },
            { name: "Finance Dashboard", path: "/dashboard/finance" },
            { name: "HR Dashboard", path: "/dashboard/hr" },
            { name: "IT Dashboard", path: "/dashboard/it" },
            { name: "Operations Dashboard", path: "/dashboard/operations" },
            { name: "Sales Dashboard", path: "/dashboard/sales" },
            { name: "SOC Dashboard", path: "/dashboard/soc" },
          ]}
        />
        
        {/* Quick Access Menu Bar */}
        <div className="bg-card border-b border-border -mx-4 px-4">
          <div className="flex gap-3 py-3 overflow-x-auto">
            {/* Operations Tools Dropdown */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 whitespace-nowrap">
                <Workflow className="h-4 w-4" />
                Operations Tools
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>Operations Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/workflow-builder')}>
                <GitBranch className="h-4 w-4 mr-2" />
                Workflow Builder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/workflow-automation')}>
                <Settings className="h-4 w-4 mr-2" />
                Trigger Manager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/workflow/executions?department=operations')}>
                <Workflow className="h-4 w-4 mr-2" />
                Execution History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Server className="h-4 w-4 mr-2" />
                  MCP Servers
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background">
                  {mcpServers.length === 0 ? (
                    <DropdownMenuItem disabled>No servers available</DropdownMenuItem>
                  ) : (
                    mcpServers.map((server) => (
                      <DropdownMenuItem
                        key={server.id}
                        onClick={() => {
                          setSelectedServerId(server.id);
                          const assistantTab = document.querySelector('[value="assistant"]') as HTMLElement;
                          assistantTab?.click();
                        }}
                      >
                        {server.server_name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reports Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 whitespace-nowrap">
                <FileText className="h-4 w-4" />
                Reports
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>Operations Reports</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/analytics?department=operations')}>
                Operations Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/workflow/efficiency?department=operations')}>
                Workflow Efficiency Reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
        
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
            {selectedServerId ? (
              <Card>
                <CardHeader>
                  <CardTitle>MCP Server Details</CardTitle>
                  <CardDescription>
                    {mcpServers.find(s => s.id === selectedServerId)?.server_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MCPServerStatus customerId={userProfile?.customer_id || "demo-customer"} />
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSelectedServerId(null)}
                  >
                    Back to All Servers
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <MCPServerStatus filterByServerType="operations" />
                <DepartmentAIAssistant 
                  department="operations" 
                  departmentLabel="Operations" 
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OperationsDashboard;
