import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Plus, Clock } from "lucide-react";
import { useAutomationData } from "@/hooks/useAutomationData";
import { WorkflowStatsCards } from "@/components/automation/WorkflowStatsCards";
import { WorkflowListCard } from "@/components/automation/WorkflowListCard";
import { ExecutionListCard } from "@/components/automation/ExecutionListCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

/**
 * Workflow Automation Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[User] -->|Visits /workflow-automation| B[WorkflowAutomation Component]
 *     B -->|useAutomationData Hook| C[useRequireAuth Check]
 *     C -->|Auth Check| D[AuthService.getCurrentUser]
 *     
 *     D -->|Authenticated| E[loadWorkflows]
 *     E -->|Query via AutomationService| F[workflows Table]
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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Workflow Automation</h1>
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
              <LoadingSpinner message="Loading workflows..." />
            ) : workflows.length === 0 ? (
              <EmptyState
                icon={Zap}
                title="No workflows yet"
                description="Create your first automation workflow"
                action={{
                  label: "Create Workflow",
                  onClick: () => navigate('/workflows/builder'),
                }}
              />
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
              <EmptyState
                icon={Clock}
                title="No executions yet"
                description="Workflow executions will appear here"
              />
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
      </div>
    </DashboardLayout>
  );
}
