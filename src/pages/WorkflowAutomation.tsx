import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Plus, Clock } from "lucide-react";
import { useAutomationData } from "@/hooks/useAutomationData";
import { dashboardLinks } from "@/lib/automationConfig";
import { WorkflowStatsCards } from "@/components/automation/WorkflowStatsCards";
import { WorkflowListCard } from "@/components/automation/WorkflowListCard";
import { ExecutionListCard } from "@/components/automation/ExecutionListCard";

/**
 * Workflow Automation Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[User] -->|Visits /workflow-automation| B[WorkflowAutomation Component]
 *     B -->|useEffect| C[checkAuthAndLoad]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     
 *     D -->|Authenticated| E[loadWorkflows]
 *     E -->|Query| F[workflows Table]
 *     F -->|Return Data| G[setWorkflows State]
 *     
 *     E -->|Query| H[workflow_executions Table]
 *     H -->|Order by started_at| I[setExecutions State]
 *     
 *     G -->|Calculate Stats| J[Total, Active, Success Rate]
 *     J -->|Update| K[Stats Cards UI]
 *     
 *     L[Create Workflow Button] -->|Navigate| M[/workflow-builder]
 *     M -->|Build| N[Workflow Configuration]
 *     N -->|Save| F
 *     
 *     O[View Workflow] -->|Click| P[/workflow/:id]
 *     P -->|Load Detail| Q[Workflow Steps & Config]
 *     Q -->|Query| R[workflow_steps Table]
 *     
 *     S[Execute Workflow] -->|Invoke| T[workflow-executor Edge Function]
 *     T -->|Process Steps| U[Step-by-Step Execution]
 *     U -->|Insert Record| H
 *     
 *     U -->|Generate Evidence| V[workflow-evidence-generator Edge Function]
 *     V -->|AI Processing| W[Evidence Generation]
 *     W -->|Store| X[evidence_files Table]
 *     
 *     Y[Trigger Manager] -->|Configure| Z[workflow_triggers Table]
 *     Z -->|Schedule/Event| AA[Auto-Execute Workflows]
 *     
 *     AB[View Execution] -->|Click| AC[/workflow-execution/:id]
 *     AC -->|Load Logs| AD[Execution Details & Logs]
 *     
 *     AE[Workflow Insights] -->|Invoke| AF[workflow-insights Edge Function]
 *     AF -->|AI Analysis| AG[Optimization Recommendations]
 *     
 *     style A fill:#e1f5ff
 *     style T fill:#fff4e6
 *     style V fill:#fff4e6
 *     style AF fill:#fff4e6
 *     style F fill:#e6f7ff
 *     style H fill:#e6f7ff
 *     style R fill:#e6f7ff
 *     style X fill:#e6f7ff
 * ```
 */

export default function WorkflowAutomation() {
  const navigate = useNavigate();
  const { workflows, executions, isLoading, stats, toggleWorkflowStatus } = useAutomationData();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-56 pb-8">
        <DashboardNavigation 
          title="Workflow Automation"
          dashboards={dashboardLinks}
        />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-muted-foreground">Automate repetitive tasks and connect systems</p>
          </div>
          <Button onClick={() => navigate('/workflows/builder')}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>

        <WorkflowStatsCards stats={stats} />

        <Tabs defaultValue="workflows" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  Loading workflows...
                </CardContent>
              </Card>
            ) : workflows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first automation workflow</p>
                  <Button onClick={() => navigate('/workflows/builder')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workflow
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {workflows.map((workflow) => (
                  <WorkflowListCard
                    key={workflow.id}
                    workflow={workflow}
                    onToggleStatus={toggleWorkflowStatus}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            {executions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
                  <p className="text-muted-foreground">Workflow executions will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {executions.map((execution) => (
                  <ExecutionListCard
                    key={execution.id}
                    execution={execution}
                    workflowName={workflows.find(w => w.id === execution.workflow_id)?.workflow_name || 'Unknown Workflow'}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
