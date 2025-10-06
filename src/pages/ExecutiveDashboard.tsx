import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LogOut, BarChart3, TrendingUp, Shield, Users, AlertCircle, CheckCircle, ChevronDown, FileText, Building, Server } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useDemoMode } from "@/hooks/useDemoMode";
import DashboardNavigation from "@/components/DashboardNavigation";
import MCPServerStatus from "@/components/MCPServerStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    customers: 0,
    complianceScore: 92,
    workflowEfficiency: 87,
    mlInsights: 0,
    anomalies: 0
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "executive" });
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
    const [customers, insights, anomalies] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("ml_insights").select("*", { count: "exact", head: true }),
      supabase.from("anomaly_detections").select("*", { count: "exact", head: true })
    ]);

    setStats({
      customers: customers.count || 0,
      complianceScore: 92,
      workflowEfficiency: 87,
      mlInsights: insights.count || 0,
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
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Executive Dashboard</h1>
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
          title="Executive Dashboard"
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
            {/* Executive Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 whitespace-nowrap">
                  <BarChart3 className="h-4 w-4" />
                  Executive Tools
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>Executive Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <Building className="h-4 w-4 mr-2" />
                Customer Management
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/analytics')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics Portal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/compliance')}>
                <Shield className="h-4 w-4 mr-2" />
                Compliance Overview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => document.getElementById('mcp-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <Server className="h-4 w-4 mr-2" />
                MCP Servers
              </DropdownMenuItem>
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
                <DropdownMenuLabel>Executive Reports</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/analytics')}>
                  Performance Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/compliance/audit-reports')}>
                  Compliance Reports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/customers?metric=Total Customers&department=executive`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customers}</div>
              <p className="text-xs text-green-600 mt-1">+12% this month</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/compliance?metric=Compliance Score&department=executive`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.complianceScore}%</div>
              <Badge variant="outline" className="mt-1">Excellent</Badge>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/efficiency?metric=Workflow Efficiency&department=executive`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflow Efficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workflowEfficiency}%</div>
              <p className="text-xs text-muted-foreground mt-1">Cross-system</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/insights?metric=ML Insights&department=executive`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ML Insights</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mlInsights}</div>
              <p className="text-xs text-muted-foreground mt-1">Actionable</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/risks?metric=Risk Alerts&department=executive`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.anomalies}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>Framework adherence and coverage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">SOC 2 Type II</span>
                  <Badge variant="outline">95%</Badge>
                </div>
                <Progress value={95} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">GDPR</span>
                  <Badge variant="outline">88%</Badge>
                </div>
                <Progress value={88} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">HIPAA</span>
                  <Badge variant="outline">72%</Badge>
                </div>
                <Progress value={72} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Monthly Recurring Revenue</p>
                  <p className="text-2xl font-bold">$45,200</p>
                </div>
                <Badge className="bg-green-500">+12.3%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Customer Retention</p>
                  <p className="text-2xl font-bold">94%</p>
                </div>
                <Badge variant="outline">Stable</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Uptime</p>
                  <p className="text-2xl font-bold">99.8%</p>
                </div>
                <Badge variant="outline">Excellent</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div id="mcp-section">
          <MCPServerStatus filterByServerType="executive" />
        </div>

        <DepartmentAIAssistant 
          department="executive" 
          departmentLabel="Executive Leadership" 
        />
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
