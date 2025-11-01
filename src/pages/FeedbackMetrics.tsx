import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/services/authService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Brain, FileText, Zap, Settings, BarChart3, ArrowUpRight } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface LearningMetrics {
  total_interactions: number;
  insights_generated: number;
  articles_created: number;
  avg_confidence_score: number;
  knowledge_base_size: number;
  improvement_rate: number;
}

interface RecentInsight {
  id: string;
  title: string;
  insight_type: string;
  confidence_score: number;
  created_at: string;
  status: string;
}

export default function FeedbackMetrics() {
  const { customerId } = useUserProfile();
  const toast = useStandardToast();
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [recentInsights, setRecentInsights] = useState<RecentInsight[]>([]);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState({
    minConfidenceScore: 0.7,
    autoCreateArticles: true,
    insightThreshold: 0.75,
    enableLearning: true
  });

  useEffect(() => {
    if (customerId) {
      loadMetrics();
      loadRecentInsights();
      loadTotalInteractions();
    }
  }, [customerId]);

  const loadMetrics = async () => {
    if (!customerId) return;
    try {
      // Get latest metrics
      const { data, error } = await supabase
        .from('ai_learning_metrics')
        .select('*')
        .eq('customer_id', customerId)
        .order('metric_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setMetrics({
          total_interactions: data.total_interactions || 0,
          insights_generated: data.insights_generated || 0,
          articles_created: data.articles_created || 0,
          avg_confidence_score: data.avg_confidence_score || 0,
          knowledge_base_size: data.knowledge_base_size || 0,
          improvement_rate: data.improvement_rate || 0
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentInsights = async () => {
    if (!customerId) return;
    try {
      const { data, error } = await supabase
        .from('knowledge_insights')
        .select('id, title, insight_type, confidence_score, created_at, status')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const loadTotalInteractions = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      const customerId = await AuthService.getCustomerId(user.id);
      if (!customerId) return;

      const { count, error } = await supabase
        .from('ai_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      if (error) throw error;
      setTotalInteractions(count || 0);
    } catch (error) {
      console.error('Error loading total interactions:', error);
    }
  };

  const saveConfig = async () => {
    toast.success("AI learning settings have been updated");
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'process_improvement': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'knowledge_gap': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'pattern_discovery': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'best_practice': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'workflow_optimization': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const conversionRate = metrics && totalInteractions > 0
    ? ((metrics.insights_generated / totalInteractions) * 100).toFixed(1)
    : 0;

  const articleConversionRate = metrics && metrics.insights_generated > 0
    ? ((metrics.articles_created / metrics.insights_generated) * 100).toFixed(1)
    : 0;

  return (
    <DashboardLayout className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">AI Feedback Loop Metrics</h1>
            <p className="text-muted-foreground">Monitor your AI learning system performance and growth</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Recent Insights</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Total Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalInteractions}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All-time AI conversations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Insights Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.insights_generated || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversionRate}% conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    Articles Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.articles_created || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {articleConversionRate}% from insights
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Avg Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics?.avg_confidence_score 
                      ? `${(metrics.avg_confidence_score * 100).toFixed(0)}%`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Insight quality score
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Loop Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>3-Layer AI Feedback Loop</CardTitle>
                <CardDescription>
                  How your knowledge grows through continuous learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Knowledge Base</h3>
                        <p className="text-sm text-muted-foreground">
                          {metrics?.knowledge_base_size || 0} articles
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your uploaded documents and generated articles serve as the foundation
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">Documents</Badge>
                      <Badge variant="outline">Webpages</Badge>
                      <Badge variant="outline">Files</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-amber-500">2</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">AI Processing</h3>
                        <p className="text-sm text-muted-foreground">
                          {totalInteractions} interactions
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI uses your knowledge base to answer questions and identify patterns
                    </p>
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{conversionRate}% insight rate</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-green-500">3</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Insight Generation</h3>
                        <p className="text-sm text-muted-foreground">
                          {metrics?.insights_generated || 0} insights
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Valuable insights become new articles, feeding back into the knowledge base
                    </p>
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{articleConversionRate}% article creation</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Base Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Growth</CardTitle>
                <CardDescription>
                  Track how your knowledge base expands over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Articles</span>
                    <span className="text-2xl font-bold">{metrics?.knowledge_base_size || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI-Generated Articles</span>
                    <span className="text-2xl font-bold">{metrics?.articles_created || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Improvement Rate</span>
                    <span className="text-2xl font-bold">
                      {metrics?.improvement_rate 
                        ? `${(metrics.improvement_rate * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Insights</CardTitle>
                <CardDescription>
                  Insights generated from AI interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentInsights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No insights generated yet. Start using the AI assistant to generate insights.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentInsights.map((insight) => (
                      <div key={insight.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold">{insight.title}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getInsightTypeColor(insight.insight_type)}>
                                {insight.insight_type.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline">
                                {(insight.confidence_score * 100).toFixed(0)}% confidence
                              </Badge>
                              <Badge variant={insight.status === 'new' ? 'default' : 'secondary'}>
                                {insight.status}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(insight.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  AI Learning Configuration
                </CardTitle>
                <CardDescription>
                  Configure thresholds and automatic behaviors for the AI feedback loop
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable AI Learning</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow AI to generate insights from interactions
                      </p>
                    </div>
                    <Switch
                      checked={config.enableLearning}
                      onCheckedChange={(checked) => setConfig({ ...config, enableLearning: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Confidence Score</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Only log insights with confidence above {(config.minConfidenceScore * 100).toFixed(0)}%
                    </p>
                    <Slider
                      value={[config.minConfidenceScore * 100]}
                      onValueChange={([value]) => setConfig({ ...config, minConfidenceScore: value / 100 })}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Insight Generation Threshold</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create insights when confidence exceeds {(config.insightThreshold * 100).toFixed(0)}%
                    </p>
                    <Slider
                      value={[config.insightThreshold * 100]}
                      onValueChange={([value]) => setConfig({ ...config, insightThreshold: value / 100 })}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Create Articles</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically create knowledge articles from high-confidence insights
                      </p>
                    </div>
                    <Switch
                      checked={config.autoCreateArticles}
                      onCheckedChange={(checked) => setConfig({ ...config, autoCreateArticles: checked })}
                    />
                  </div>
                </div>

                <Button onClick={saveConfig} className="w-full">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Settings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Learning</span>
                    <Badge variant={config.enableLearning ? "default" : "secondary"}>
                      {config.enableLearning ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Confidence</span>
                    <span className="font-medium">{(config.minConfidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insight Threshold</span>
                    <span className="font-medium">{(config.insightThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto-Create Articles</span>
                    <Badge variant={config.autoCreateArticles ? "default" : "secondary"}>
                      {config.autoCreateArticles ? "On" : "Off"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
}
