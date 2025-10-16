import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { useOperationsData } from "@/hooks/useOperationsData";
import { metricCards, workflowMetrics } from "@/lib/operationsConfig";

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
  const navigate = useNavigate();
  const { isLoading, stats } = useOperationsData();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 space-y-6" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <DashboardSettingsMenu dashboardName="Operations" />
        </div>
        
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            const value = metric.getValue(stats);
            const badge = metric.getBadge?.(stats);
            const subtext = metric.getSubtext?.(stats);

            return (
              <Card 
                key={metric.title}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(metric.path)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.title === "Workflow Efficiency" ? `${value}%` : value}
                  </div>
                  {metric.title === "Workflow Efficiency" && (
                    <Progress value={value} className="mt-2" />
                  )}
                  {badge && <Badge variant={badge.variant} className="mt-1">{badge.text}</Badge>}
                  {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cross-System Workflow Efficiency</CardTitle>
            <CardDescription>Performance metrics across integrated systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowMetrics.map((workflow) => (
              <div key={workflow.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{workflow.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{workflow.avgTime}</span>
                    <Badge variant={workflow.badge.variant}>{workflow.badge.text}</Badge>
                  </div>
                </div>
                <Progress 
                  value={workflow.efficiency} 
                  className={workflow.hasIssue ? "bg-destructive/20" : undefined}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <DepartmentAIAssistant 
          department="operations" 
          departmentLabel="Operations" 
        />
      </main>
    </div>
  );
};

export default OperationsDashboard;
