import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Server, Activity, AlertCircle, Zap, Shield, ChevronDown, FileText, Database, Settings } from "lucide-react";
import MCPServerStatus from "@/components/MCPServerStatus";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useDemoMode } from "@/hooks/useDemoMode";
import DashboardNavigation from "@/components/DashboardNavigation";
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

const ITDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    integrations: 0,
    activeIntegrations: 0,
    mcpServers: 0,
    anomalies: 0
  });
  const [mcpServersList, setMcpServersList] = useState<any[]>([]);

  useEffect(() => {
    checkAccess();
    fetchMcpServersList();
  }, []);

  const fetchMcpServersList = async () => {
    const { data } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "it")
      .eq("status", "active")
      .order("server_name");
    
    if (data) setMcpServersList(data);
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "it" });
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
    const [integrations, mcpServers, anomalies] = await Promise.all([
      supabase.from("integrations").select("*"),
      supabase.from("mcp_servers").select("*", { count: "exact", head: true }),
      supabase.from("anomaly_detections").select("*", { count: "exact", head: true })
    ]);

    const activeIntegrations = integrations.data?.filter(i => i.status === "active").length || 0;

    setStats({
      integrations: integrations.data?.length || 0,
      activeIntegrations,
      mcpServers: mcpServers.count || 0,
      anomalies: anomalies.count || 0
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
            <Server className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">IT & Security Dashboard</h1>
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
          title="IT Dashboard"
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
            {/* IT Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 whitespace-nowrap">
                  <Server className="h-4 w-4" />
                  IT Tools
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>IT Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/cmdb')}>
                <Database className="h-4 w-4 mr-2" />
                CMDB Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/change-management')}>
                <Settings className="h-4 w-4 mr-2" />
                Change Management
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/integrations')}>
                <Zap className="h-4 w-4 mr-2" />
                Integrations
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Server className="h-4 w-4 mr-2" />
                  MCP Servers
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background">
                  <DropdownMenuItem onClick={() => navigate('/mcp-servers')}>
                    All MCP Servers
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {mcpServersList.length === 0 ? (
                    <DropdownMenuItem disabled>No IT servers</DropdownMenuItem>
                  ) : (
                    mcpServersList.map((server) => (
                      <DropdownMenuItem
                        key={server.id}
                        onClick={() => navigate(`/mcp-servers?server=${server.id}`)}
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
                <DropdownMenuLabel>IT Reports</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/analytics?department=it')}>
                  IT Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/workflow/system-health?department=it')}>
                  System Health Reports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/integrations?metric=Total Integrations&department=it`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.integrations}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.activeIntegrations} active</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/mcp-servers?metric=MCP Servers&department=it`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MCP Servers</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mcpServers}</div>
              <Badge variant="outline" className="mt-1">AI-Powered</Badge>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/system-health?metric=System Health&department=it`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">98.5%</div>
              <p className="text-xs text-muted-foreground mt-1">Uptime</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/anomalies?metric=Anomalies Detected&department=it`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.anomalies}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires review</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Security Operations</CardTitle>
            <CardDescription>Access advanced security monitoring and threat detection</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/soc">
              <Button className="w-full" variant="outline" size="lg">
                <Shield className="h-5 w-5 mr-2" />
                Open Security Operations Center (SOC)
              </Button>
            </Link>
          </CardContent>
        </Card>

        <DepartmentAIAssistant 
          department="it" 
          departmentLabel="IT & Security" 
        />
      </div>
    </div>
  );
};

export default ITDashboard;
