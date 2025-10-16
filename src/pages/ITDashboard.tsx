import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { useITData } from "@/hooks/useITData";
import { ITMetricCards } from "@/components/it/ITMetricCards";
import { SecurityOperationsCard } from "@/components/it/SecurityOperationsCard";

/**
 * IT Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[User] -->|Visits /dashboard/it| B[ITDashboard Component]
 *     B -->|useEffect| C[checkAccess & fetchStats]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     D -->|Get Profile| E[user_profiles Table]
 *     
 *     C -->|Parallel Queries| F[fetchStats]
 *     F -->|Count| G[integrations Table]
 *     F -->|Count| H[mcp_servers Table]
 *     F -->|Count| I[anomaly_detections Table]
 *     
 *     G -->|Filter Active| J[activeIntegrations]
 *     J -->|Set State| K[stats.activeIntegrations]
 *     H -->|Set State| L[stats.mcpServers]
 *     I -->|Set State| M[stats.anomalies]
 *     
 *     B -->|Fetch MCP List| N[fetchMcpServersList]
 *     N -->|Query by Type| H
 *     N -->|Filter: server_type=it| O[IT MCP Servers]
 *     O -->|Render| P[MCP Dropdown Menu]
 *     
 *     Q[Integrations Menu] -->|Navigate| R[/integrations]
 *     
 *     S[CMDB Menu] -->|Navigate| T[/cmdb]
 *     T -->|Load CI Data| U[configuration_items Table]
 *     
 *     V[Change Management] -->|Navigate| W[/change-management]
 *     
 *     X[AI Assistant] -->|Invoke| Y[department-assistant Edge Function]
 *     Y -->|Context: IT| Z[AI Response]
 *     
 *     AA[MCP Server Status] -->|Real-time| AB[Server Health Monitoring]
 *     
 *     style A fill:#e1f5ff
 *     style Y fill:#fff4e6
 *     style G fill:#e6f7ff
 *     style H fill:#e6f7ff
 *     style I fill:#e6f7ff
 *     style U fill:#e6f7ff
 * ```
 */

const ITDashboard = () => {
  const { isLoading, stats } = useITData();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 space-y-6" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">IT Dashboard</h1>
          <DashboardSettingsMenu dashboardName="IT" />
        </div>
        
        <ITMetricCards stats={stats} />

        <SecurityOperationsCard />

        <DepartmentAIAssistant 
          department="it" 
          departmentLabel="IT & Security" 
        />
      </main>
    </div>
  );
};

export default ITDashboard;
