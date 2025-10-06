import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LogOut, Shield, CheckCircle, AlertTriangle, FileText, FileCheck, ChevronDown, ClipboardList, FolderOpen, Server } from "lucide-react";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

const ComplianceDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    frameworks: 0,
    controls: 0,
    reports: 0,
    evidenceFiles: 0,
    complianceScore: 92
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
      .eq("server_type", "compliance")
      .eq("status", "active")
      .order("server_name");
    
    if (data) setMcpServers(data);
  };

  const checkAccess = async () => {
    // Skip authentication in preview mode
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "compliance" });
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
    const [frameworks, controls, reports, evidence] = await Promise.all([
      supabase.from("compliance_frameworks").select("*", { count: "exact", head: true }),
      supabase.from("compliance_controls").select("*", { count: "exact", head: true }),
      supabase.from("compliance_reports").select("*", { count: "exact", head: true }),
      supabase.from("evidence_files").select("*", { count: "exact", head: true })
    ]);

    setStats({
      frameworks: frameworks.count || 0,
      controls: controls.count || 0,
      reports: reports.count || 0,
      evidenceFiles: evidence.count || 0,
      complianceScore: 92
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
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Compliance Dashboard</h1>
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
          title="Compliance Dashboard"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics" },
            { name: "Compliance Portal", path: "/compliance" },
            { name: "Change Management", path: "/change-management" },
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
            {/* Compliance Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 whitespace-nowrap">
                  <Shield className="h-4 w-4" />
                  Compliance Tools
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>Compliance Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/compliance/audit-reports')}>
                <FileCheck className="h-4 w-4 mr-2" />
                Audit Reports
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/compliance/evidence-upload')}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Evidence Upload
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/compliance/framework-records')}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Framework Records
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/compliance')}>
                <Shield className="h-4 w-4 mr-2" />
                Compliance Portal
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
                    <DropdownMenuItem disabled>No compliance servers</DropdownMenuItem>
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
                <DropdownMenuLabel>Compliance Reports</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/compliance/audit-reports')}>
                  Compliance Audit Reports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/compliance/framework-records')}>
                  Framework Status Reports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Primary Compliance Frameworks - ISO27001 & SOC 2 */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                ISO 27001
              </CardTitle>
              <CardDescription>Information Security Management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">94%</span>
                  <Badge variant="default">Compliant</Badge>
                </div>
                <Progress value={94} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  All workflows tagged with ISO27001 compliance
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                SOC 2 Type II
              </CardTitle>
              <CardDescription>Service Organization Controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">95%</span>
                  <Badge variant="default">Compliant</Badge>
                </div>
                <Progress value={95} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  All workflows tagged with SOC2 compliance
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/compliance-score?metric=Compliance Score&department=compliance`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.complianceScore}%</div>
              <Progress value={stats.complianceScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/frameworks?metric=Active Frameworks&department=compliance`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Frameworks</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.frameworks}</div>
              <p className="text-xs text-muted-foreground mt-1">ISO27001, SOC 2, GDPR</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/controls?metric=Controls&department=compliance`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Controls</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.controls}</div>
              <p className="text-xs text-muted-foreground mt-1">Active monitoring</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/workflow/evidence?metric=Evidence Files&department=compliance`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evidence Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evidenceFiles}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.reports} reports</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Additional Framework Coverage</CardTitle>
            <CardDescription>Other compliance frameworks status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">GDPR</span>
                <Badge>88% Complete</Badge>
              </div>
              <Progress value={88} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">HIPAA</span>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <Progress value={72} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">PCI DSS</span>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <Progress value={65} />
            </div>
          </CardContent>
        </Card>

        <DepartmentAIAssistant 
          department="compliance" 
          departmentLabel="Compliance & GRC" 
        />
      </div>
    </div>
  );
};

export default ComplianceDashboard;
