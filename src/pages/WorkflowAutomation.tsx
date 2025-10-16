import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Play, Pause, Plus, Clock } from "lucide-react";
import { useAutomationData } from "@/hooks/useAutomationData";
import { 
  statCards, 
  getStatusColor, 
  getExecutionStatusColor, 
  getExecutionIcon, 
  getTriggerLabel,
  dashboardLinks 
} from "@/lib/automationConfig";

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ icon: Icon, label, key, suffix = '', colorClass = '' }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${colorClass}`}>
                  {stats[key]}{suffix}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                  <Card 
                    key={workflow.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {workflow.workflow_name}
                            <Badge variant={getStatusColor(workflow.is_active) as any}>
                              {workflow.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {workflow.description || "No description"}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkflowStatus(workflow.id, workflow.is_active);
                          }}
                        >
                          {workflow.is_active ? (
                            <><Pause className="mr-2 h-4 w-4" /> Pause</>
                          ) : (
                            <><Play className="mr-2 h-4 w-4" /> Activate</>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">Type: {workflow.workflow_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card key={execution.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 flex-1">
                          {getExecutionIcon(execution.status)}
                          <div className="flex-1">
                            <p className="font-semibold text-base">
                              {workflows.find(w => w.id === execution.workflow_id)?.workflow_name || 'Unknown Workflow'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getTriggerLabel(execution.triggered_by)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Started {new Date(execution.started_at).toLocaleString()}
                              {execution.completed_at && ` • Completed in ${((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(1)}s`}
                            </p>
                            {execution.error_message && (
                              <p className="text-sm text-destructive mt-2 p-2 bg-destructive/5 rounded">{execution.error_message}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={getExecutionStatusColor(execution.status) as any}>
                          {execution.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
