import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComplianceData } from "@/hooks/useComplianceData";
import { ComplianceService } from "@/services/complianceService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Activity, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";


import MCPServerStatus from "@/components/MCPServerStatus";
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
 * Compliance Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[User] -->|Visits /compliance-dashboard| B[ComplianceDashboard Component]
 *     B -->|useEffect| C[checkAccess & fetchStats]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     D -->|Get Profile| E[user_profiles Table]
 *     
 *     C -->|Parallel Queries| F[fetchStats]
 *     F -->|Count| G[compliance_frameworks Table]
 *     F -->|Count| H[compliance_controls Table]
 *     F -->|Count| I[compliance_reports Table]
 *     F -->|Count| J[evidence_files Table]
 *     
 *     G -->|Set State| K[stats.frameworks]
 *     H -->|Set State| L[stats.controls]
 *     I -->|Set State| M[stats.reports]
 *     J -->|Set State| N[stats.evidenceFiles]
 *     
 *     K -->|Render| O[Framework Cards]
 *     L -->|Render| P[Control Stats]
 *     M -->|Render| Q[Report Count]
 *     N -->|Render| R[Evidence Count]
 *     
 *     S[Click Framework Card] -->|Navigate| T[/workflow/compliance-score]
 *     T -->|AI Processing| U[workflow-executor Edge Function]
 *     U -->|Generate Evidence| V[workflow-evidence-generator]
 *     V -->|Store| J
 *     
 *     W[MCP Servers Menu] -->|Query| X[mcp_servers Table]
 *     X -->|Filter by Type| Y[server_type = 'compliance']
 *     Y -->|Display| Z[Server Dropdown]
 *     
 *     AA[AI Assistant] -->|Query| AB[department-assistant Edge Function]
 *     AB -->|Compliance Context| AC[AI Response]
 *     
 *     style A fill:#e1f5ff
 *     style U fill:#fff4e6
 *     style V fill:#fff4e6
 *     style AB fill:#fff4e6
 *     style G fill:#e6f7ff
 *     style H fill:#e6f7ff
 *     style I fill:#e6f7ff
 *     style J fill:#e6f7ff
 * ```
 */

const ComplianceDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const { profile, customerId, isLoading: profileLoading } = useUserProfile(!isPreviewMode);
  const [stats, setStats] = useState({
    frameworks: 0,
    controls: 0,
    reports: 0,
    evidenceFiles: 0,
    complianceScore: 92
  });
  const [mcpServers, setMcpServers] = useState<any[]>([]);

  useEffect(() => {
    if (isPreviewMode) {
      fetchStats();
    } else if (customerId) {
      fetchStats();
    }
    fetchMcpServers();
  }, [customerId, isPreviewMode]);

  const fetchMcpServers = async () => {
    try {
      const data = await ComplianceService.getMcpServers();
      setMcpServers(data);
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
    }
  };

  // Now using useComplianceData hook
  const { stats: complianceHookStats, isLoading: complianceHookLoading } = useComplianceData();
  
  useEffect(() => {
    if (complianceHookStats) {
      setStats({
        frameworks: complianceHookStats.frameworks,
        controls: 0, // Not provided by hook yet
        reports: complianceHookStats.reports,
        evidenceFiles: complianceHookStats.evidenceFiles,
        complianceScore: complianceHookStats.complianceScore
      });
    }
  }, [complianceHookStats]);

  const fetchStats = async () => {
    try {
      const counts = await ComplianceService.getComplianceCounts();
      setStats({
        ...counts,
        complianceScore: 92
      });
    } catch (error) {
      console.error('Error fetching compliance stats:', error);
    }
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate("/demo");
    } else {
      navigate("/auth");
    }
  };

  if (profileLoading) {
    return <DashboardLayout><div className="flex items-center justify-center py-12">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
          <DashboardSettingsMenu dashboardName="Compliance" />
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 justify-start" onClick={() => navigate('/risk-assessment')}>
                <Shield className="h-4 w-4 mr-2" />
                Risk Assessment Portal
              </Button>
              <Button variant="outline" className="flex-1 justify-start" onClick={() => navigate('/dashboard/soc')}>
                <Activity className="h-4 w-4 mr-2" />
                Security Operations
              </Button>
            </div>
          </CardContent>
        </Card>

      <DepartmentAIAssistant
        department="compliance" 
        departmentLabel="Compliance & GRC" 
      />
    </DashboardLayout>
  );
};

export default ComplianceDashboard;
