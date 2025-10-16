import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { useHRData } from "@/hooks/useHRData";
import { HRMetricCards } from "@/components/hr/HRMetricCards";
import { HRQuickActionsCards } from "@/components/hr/HRQuickActionsCards";
import { HRDepartmentBreakdown } from "@/components/hr/HRDepartmentBreakdown";

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
  const { isLoading, stats } = useHRData();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 space-y-6" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">HR Dashboard</h1>
          <DashboardSettingsMenu dashboardName="HR" />
        </div>
        
        <HRMetricCards stats={stats} />

        <HRQuickActionsCards />

        <HRDepartmentBreakdown />

        <DepartmentAIAssistant 
          department="hr" 
          departmentLabel="Human Resources" 
        />
      </main>
    </div>
  );
};

export default HRDashboard;
