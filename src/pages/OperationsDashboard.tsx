import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { useOperationsData } from "@/hooks/useOperationsData";
import { OperationsMetricCards } from "@/components/operations/OperationsMetricCards";
import { WorkflowEfficiencyCard } from "@/components/operations/WorkflowEfficiencyCard";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

/**
 * Operations Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[Operations User] -->|Visits /dashboard/operations| B[OperationsDashboard Component]
 *     B -->|useEffect| C[checkAccess & fetchStats]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     D -->|Get Profile| E[user_profiles Table]
 *     
 *     C -->|Parallel Queries| F[fetchStats]
 *     F -->|Count| G[workflows Table]
 *     F -->|Count| H[ml_insights Table]
 *     
 *     G -->|Set State| I[stats.workflows]
 *     H -->|Set State| J[stats.mlInsights]
 *     
 *     B -->|Fetch MCP Servers| K[fetchMcpServers]
 *     K -->|Query| L[mcp_servers Table]
 *     K -->|Filter: server_type=operations| M[Operations MCP Servers]
 *     M -->|Display| N[MCP Dropdown Menu]
 *     
 *     O[Workflow Menu] -->|Navigate| P[/workflow-automation]
 *     P -->|Load| Q[workflows Table]
 *     Q -->|Join| R[workflow_steps Table]
 *     R -->|Join| S[workflow_executions Table]
 *     
 *     T[View Workflow] -->|Click| U[/workflow/:id]
 *     U -->|Load Detail| V[Workflow Configuration]
 *     
 *     W[Execute Workflow] -->|Invoke| X[workflow-executor Edge Function]
 *     X -->|Process Steps| Y[Step-by-Step Execution]
 *     Y -->|Generate Evidence| Z[workflow-evidence-generator]
 *     Z -->|Store| AA[evidence_files Table]
 *     
 *     AB[ML Insights] -->|Query| H
 *     AB -->|Analyze| AC[workflow-insights Edge Function]
 *     AC -->|Generate| AD[Optimization Recommendations]
 *     
 *     AE[AI Assistant] -->|Invoke| AF[department-assistant Edge Function]
 *     AF -->|Context: Operations| AG[Operational Insights]
 *     
 *     AH[Efficiency Score] -->|Calculate| AI[Avg Execution Time & Success Rate]
 *     
 *     style A fill:#e1f5ff
 *     style X fill:#fff4e6
 *     style Z fill:#fff4e6
 *     style AC fill:#fff4e6
 *     style AF fill:#fff4e6
 *     style G fill:#e6f7ff
 *     style H fill:#e6f7ff
 *     style Q fill:#e6f7ff
 *     style S fill:#e6f7ff
 * ```
 */

const OperationsDashboard = () => {
  const { isLoading, stats } = useOperationsData();

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center py-12">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Operations Dashboard</h1>
        <DashboardSettingsMenu dashboardName="Operations" />
      </div>
      
      <OperationsMetricCards stats={stats} />

      <WorkflowEfficiencyCard />

      <DepartmentAIAssistant 
        department="operations" 
        departmentLabel="Operations" 
      />
    </DashboardLayout>
  );
};

export default OperationsDashboard;
