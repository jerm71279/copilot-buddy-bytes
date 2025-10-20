import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Workflow, 
  Lightbulb, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Brain,
  Database,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface WorkflowMetrics {
  total_executions: number;
  success_rate: number;
  avg_execution_time: number;
  insights_generated: number;
  articles_created: number;
}

interface RecentFlow {
  id: string;
  workflow_name: string;
  execution_time: string;
  status: string;
  insight_generated: boolean;
  article_created: boolean;
  department: string;
}

const WorkflowKnowledgeIntegration = () => {
  const [metrics, setMetrics] = useState<WorkflowMetrics>({
    total_executions: 0,
    success_rate: 0,
    avg_execution_time: 0,
    insights_generated: 0,
    articles_created: 0
  });
  const [recentFlows, setRecentFlows] = useState<RecentFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Real-time subscription for workflow executions
    const workflowChannel = supabase
      .channel('workflow-knowledge-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_executions'
        },
        (payload) => {
          console.log('New workflow execution:', payload);
          toast.info('New Workflow Execution', {
            description: 'A workflow has completed and is being analyzed'
          });
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'knowledge_insights'
        },
        (payload) => {
          console.log('New insight generated:', payload);
          toast.success('Insight Generated', {
            description: 'A new knowledge insight has been created from workflow data'
          });
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'knowledge_articles'
        },
        (payload) => {
          console.log('New article created:', payload);
          toast.success('Article Created', {
            description: 'An approved insight has been converted to a knowledge article'
          });
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workflowChannel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get workflow execution metrics (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: executions, error: execError } = await supabase
        .from('workflow_executions')
        .select('*')
        .gte('started_at', sevenDaysAgo.toISOString());

      if (execError) throw execError;

      const successCount = executions?.filter(e => e.status === 'completed').length || 0;
      const totalCount = executions?.length || 0;
      // Calculate average execution time from started_at to completed_at
      const avgTime = executions?.reduce((acc, e) => {
        if (e.started_at && e.completed_at) {
          const duration = new Date(e.completed_at).getTime() - new Date(e.started_at).getTime();
          return acc + duration;
        }
        return acc;
      }, 0) / (totalCount || 1);

      // Get insights generated from workflows
      const { data: insights, error: insightError } = await supabase
        .from('knowledge_insights')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (insightError) throw insightError;

      // Get articles created
      const { data: articles, error: articleError } = await supabase
        .from('knowledge_articles')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (articleError) throw articleError;

      setMetrics({
        total_executions: totalCount,
        success_rate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
        avg_execution_time: avgTime / 1000, // Convert to seconds
        insights_generated: insights?.length || 0,
        articles_created: articles?.length || 0
      });

      // Get recent workflow-to-knowledge flows
      const { data: recentExecutions } = await supabase
        .from('workflow_executions')
        .select(`
          id,
          workflow_id,
          status,
          started_at,
          completed_at,
          workflows!inner(workflow_name)
        `)
        .order('started_at', { ascending: false })
        .limit(10);

      if (recentExecutions) {
        const flows: RecentFlow[] = await Promise.all(
          recentExecutions.map(async (exec) => {
            // Check if this execution generated an insight
            const { data: relatedInsight } = await supabase
              .from('ai_interactions')
              .select('insight_generated')
              .eq('metadata->>workflow_id', exec.workflow_id)
              .gte('created_at', exec.started_at)
              .maybeSingle();

            // Check if an article was created
            const { data: relatedArticle } = await supabase
              .from('knowledge_articles')
              .select('id')
              .gte('created_at', exec.started_at)
              .limit(1)
              .maybeSingle();

            return {
              id: exec.id,
              workflow_name: (exec.workflows as any)?.workflow_name || 'Unknown',
              execution_time: exec.started_at,
              status: exec.status,
              insight_generated: relatedInsight?.insight_generated || false,
              article_created: !!relatedArticle,
              department: 'General' // Could be enhanced with actual department data
            };
          })
        );

        setRecentFlows(flows);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Running</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Workflow-Knowledge Integration
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time visualization of how workflow executions feed the knowledge base
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Database className="h-3 w-3" />
            Live Data
          </Badge>
        </div>

        {/* Three-Layer Learning Loop Visualization */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Three-Layer Learning Loop
            </CardTitle>
            <CardDescription>
              How workflow data transforms into organizational knowledge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Layer 1 */}
              <div className="relative">
                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Workflow className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Layer 1: Execution</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Individual workflows execute and log performance data
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Total Executions:</span>
                        <span className="font-semibold ml-2">{metrics.total_executions}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Success Rate:</span>
                        <span className="font-semibold ml-2">{metrics.success_rate.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Avg Time:</span>
                        <span className="font-semibold ml-2">{metrics.avg_execution_time.toFixed(1)}s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              </div>

              {/* Layer 2 */}
              <div className="relative">
                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Layer 2: Insights</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      AI analyzes patterns and generates department insights
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Insights Generated:</span>
                        <span className="font-semibold ml-2">{metrics.insights_generated}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Queue Status:</span>
                        <Badge variant="outline" className="ml-2">Under Review</Badge>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Relevance:</span>
                        <span className="font-semibold ml-2">Indexed by Dept</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              </div>

              {/* Layer 3 */}
              <div>
                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Layer 3: Knowledge</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Approved insights become searchable articles
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Articles Created:</span>
                        <span className="font-semibold ml-2">{metrics.articles_created}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Auto-Approved:</span>
                        <span className="font-semibold ml-2">≥80% Confidence</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className="ml-2">Searchable</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_executions}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.success_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Avg Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avg_execution_time.toFixed(1)}s</div>
              <p className="text-xs text-muted-foreground">Per execution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.insights_generated}</div>
              <p className="text-xs text-muted-foreground">Generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.articles_created}</div>
              <p className="text-xs text-muted-foreground">Published</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Flows */}
        <Tabs defaultValue="flows" className="space-y-4">
          <TabsList>
            <TabsTrigger value="flows">Recent Flows</TabsTrigger>
            <TabsTrigger value="pipeline">Knowledge Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="flows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow → Insight → Article Flow</CardTitle>
                <CardDescription>
                  Track how individual workflow executions transform into knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading flows...</div>
                ) : recentFlows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No recent workflow executions</div>
                ) : (
                  <div className="space-y-3">
                    {recentFlows.map((flow) => (
                      <div 
                        key={flow.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {getStatusIcon(flow.status)}
                          <div className="flex-1">
                            <div className="font-medium">{flow.workflow_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(flow.execution_time).toLocaleString()}
                            </div>
                          </div>
                          {getStatusBadge(flow.status)}
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground" />

                        <div className="flex items-center gap-2">
                          <Lightbulb className={`h-4 w-4 ${flow.insight_generated ? 'text-yellow-500' : 'text-muted-foreground/30'}`} />
                          <span className="text-xs">
                            {flow.insight_generated ? 'Insight' : 'No Insight'}
                          </span>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground" />

                        <div className="flex items-center gap-2">
                          <FileText className={`h-4 w-4 ${flow.article_created ? 'text-purple-500' : 'text-muted-foreground/30'}`} />
                          <span className="text-xs">
                            {flow.article_created ? 'Article' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Creation Pipeline</CardTitle>
                <CardDescription>
                  How the system processes workflow data into knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Stage 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Workflow className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">Workflow Execution</h4>
                      <p className="text-sm text-muted-foreground">
                        Workflows execute and log performance, errors, and outcomes to workflow_executions table
                      </p>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">AI Pattern Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Autonomous agents analyze patterns, detect anomalies, and correlate workflow data with compliance requirements
                      </p>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">Insight Generation</h4>
                      <p className="text-sm text-muted-foreground">
                        High-confidence patterns (≥80%) generate insights, indexed by department and relevance score for review
                      </p>
                    </div>
                  </div>

                  {/* Stage 4 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">Review & Approval</h4>
                      <p className="text-sm text-muted-foreground">
                        Department experts review queued insights, approve relevant ones, and reject noise
                      </p>
                    </div>
                  </div>

                  {/* Stage 5 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">Knowledge Article Creation</h4>
                      <p className="text-sm text-muted-foreground">
                        Approved insights automatically transform into searchable knowledge base articles
                      </p>
                    </div>
                  </div>

                  {/* Stage 6 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">Continuous Improvement</h4>
                      <p className="text-sm text-muted-foreground">
                        Knowledge feeds back into workflow optimization, creating a self-improving system
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">💡 How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Real-Time Learning:</strong> Every workflow execution is analyzed for patterns, bottlenecks, and optimization opportunities</p>
            <p><strong>Department Indexing:</strong> Insights are categorized by department and relevance score for efficient review</p>
            <p><strong>Quality Control:</strong> Human experts review insights before they become knowledge articles, ensuring accuracy</p>
            <p><strong>Automatic Publishing:</strong> High-confidence insights (≥80%) can auto-create articles once approved</p>
            <p><strong>Feedback Loop:</strong> Published knowledge helps improve future workflows, creating a self-optimizing system</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowKnowledgeIntegration;
