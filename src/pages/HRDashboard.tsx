import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, UserCheck, Clock, TrendingUp, ChevronDown, FileText, ClipboardList, UserPlus, Server } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useDemoMode } from "@/hooks/useDemoMode";
import Navigation from "@/components/Navigation";
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

/**
 * HR Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[HR User] -->|Visits /dashboard/hr| B[HRDashboard Component]
 *     B -->|useEffect| C[checkAccess & fetchStats]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     D -->|Get Profile| E[user_profiles Table]
 *     
 *     C -->|Parallel Queries| F[fetchStats]
 *     F -->|Count| G[user_profiles Table]
 *     F -->|Count| H[client_onboardings Table]
 *     
 *     G -->|Set State| I[stats.totalUsers]
 *     H -->|Set State| J[Onboarding Stats]
 *     
 *     B -->|Fetch MCP Servers| K[fetchMcpServers]
 *     K -->|Query| L[mcp_servers Table]
 *     K -->|Filter: server_type=hr| M[HR MCP Servers]
 *     M -->|Display| N[MCP Dropdown Menu]
 *     
 *     O[Onboarding Menu] -->|Navigate| P[/onboarding-dashboard]
 *     P -->|Load| Q[client_onboardings Table]
 *     Q -->|Join| R[client_onboarding_tasks Table]
 *     
 *     S[Templates Menu] -->|Navigate| T[/onboarding-templates]
 *     T -->|Load| U[onboarding_templates Table]
 *     
 *     V[Click User Metric] -->|Navigate| W[/workflow/employee-data]
 *     W -->|Invoke| X[workflow-executor Edge Function]
 *     X -->|Process| Y[User Analytics]
 *     
 *     Z[AI Assistant] -->|Invoke| AA[department-assistant Edge Function]
 *     AA -->|Context: HR| AB[HR Insights & Recommendations]
 *     
 *     AC[MCP Server Status] -->|Monitor| AD[Real-time Health]
 *     
 *     style A fill:#e1f5ff
 *     style X fill:#fff4e6
 *     style AA fill:#fff4e6
 *     style G fill:#e6f7ff
 *     style H fill:#e6f7ff
 *     style L fill:#e6f7ff
 *     style Q fill:#e6f7ff
 *     style R fill:#e6f7ff
 * ```
 */

const HRDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    notifications: 0,
    avgSessionTime: "4.2 hrs"
  });
  const [mcpServers, setMcpServers] = useState<any[]>([]);

  useEffect(() => {
    checkAccess();
    fetchMcpServers();
  }, []);

  const fetchMcpServers = async () => {
    const { data } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "hr")
      .eq("status", "active")
      .order("server_name");
    
    if (data) setMcpServers(data);
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "hr" });
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
    const [profiles, sessions, notifications] = await Promise.all([
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("user_sessions").select("*").eq("status", "active"),
      supabase.from("notifications").select("*", { count: "exact", head: true })
    ]);

    setStats({
      totalUsers: profiles.count || 0,
      activeSessions: sessions.data?.length || 0,
      notifications: notifications.count || 0,
      avgSessionTime: "4.2 hrs"
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
      <Navigation />

      <div className="container mx-auto px-4 pt-28 pb-8 space-y-6">
        <DashboardNavigation 
          title="HR Dashboard"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics" },
            { name: "Compliance Portal", path: "/compliance" },
            { name: "Change Management", path: "/change-management" },
            { name: "Onboarding Dashboard", path: "/onboarding" },
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
            {/* HR Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 whitespace-nowrap">
                  <Users className="h-4 w-4" />
                  HR Tools
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>HR Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/onboarding')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Employee Onboarding
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/workflow/employees?department=hr')}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Employee Records
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/workflow/performance-reviews?department=hr')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance Reviews
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
                  {mcpServers.length === 0 ? (
                    <DropdownMenuItem disabled>No HR servers</DropdownMenuItem>
                  ) : (
                    mcpServers.map((server) => (
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
                <DropdownMenuLabel>HR Reports</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/analytics?department=hr')}>
                  HR Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/workflow/workforce-reports?department=hr')}>
                  Workforce Reports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/employees?metric=Total Employees&department=hr`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/sessions?metric=Active Sessions&department=hr`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <Badge variant="outline" className="mt-1">Currently Online</Badge>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/session-time?metric=Avg Session Time&department=hr`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSessionTime}</div>
              <p className="text-xs text-muted-foreground mt-1">Per employee</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/notifications?metric=Notifications&department=hr`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notifications}</div>
              <p className="text-xs text-muted-foreground mt-1">Total sent</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
            <CardDescription>Employee distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Compliance</span>
                <Badge>8 employees</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">IT & Security</span>
                <Badge>12 employees</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Operations</span>
                <Badge>15 employees</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Finance</span>
                <Badge>6 employees</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <DepartmentAIAssistant 
          department="hr" 
          departmentLabel="Human Resources" 
        />
      </div>
    </div>
  );
};

export default HRDashboard;
