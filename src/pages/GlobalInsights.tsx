import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Globe, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  CheckCircle,
  Clock,
  Users,
  ArrowRight
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

interface RecommendedAction {
  action: string;
  owner: string;
  timeline: string;
}

interface GlobalInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  affected_departments: string[];
  confidence_score: number;
  impact_level: string;
  priority: number;
  recommended_actions: RecommendedAction[] | any;
  expected_impact: string;
  implementation_complexity: string;
  status: string;
  created_at: string;
}

export default function GlobalInsights() {
  const [insights, setInsights] = useState<GlobalInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchGlobalInsights();
  }, []);

  const fetchGlobalInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('global_insights')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse recommended_actions if it's a string
      const parsedInsights = (data || []).map(insight => ({
        ...insight,
        recommended_actions: typeof insight.recommended_actions === 'string' 
          ? JSON.parse(insight.recommended_actions)
          : insight.recommended_actions
      }));
      
      setInsights(parsedInsights);
    } catch (error) {
      console.error('Error fetching global insights:', error);
      toast.error('Failed to load global insights');
    } finally {
      setLoading(false);
    }
  };

  const runProcessor = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('central-mml-processor', {
        // Some backends expect a JSON body to parse
        body: {}
      });

      if (error) throw error as any;

      const count = (data as any)?.globalInsightsGenerated ?? 0;

      toast.success(`Generated ${count} new global insights`);
      await fetchGlobalInsights();
    } catch (err: any) {
      console.error('Error running processor (full):', err);

      const status = err?.context?.response?.status ?? err?.status ?? err?.context?.status;
      const message = err?.message ?? err?.context?.response?.statusText ?? 'Edge Function returned a non-2xx status code';

      toast.error(status ? `Initialization Failed (${status})` : 'Initialization Failed', {
        description: message || 'Check console for full details',
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateStatus = async (insightId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('global_insights')
        .update({ status: newStatus })
        .eq('id', insightId);

      if (error) throw error;
      
      toast.success('Status updated');
      await fetchGlobalInsights();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cross_department_pattern': return <TrendingUp className="h-5 w-5" />;
      case 'organizational_risk': return <AlertTriangle className="h-5 w-5" />;
      case 'efficiency_opportunity': return <Target className="h-5 w-5" />;
      case 'knowledge_gap': return <Lightbulb className="h-5 w-5" />;
      case 'process_improvement': return <CheckCircle className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Global Insights</h1>
          <p className="text-muted-foreground">
            Cross-department patterns and organizational recommendations
          </p>
        </div>
        <Button onClick={runProcessor} disabled={processing}>
          {processing ? 'Processing...' : 'Run MML Processor'}
        </Button>
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Global Insights Yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Run the MML processor to analyze department insights and generate global recommendations
            </p>
            <Button onClick={runProcessor} disabled={processing}>
              {processing ? 'Processing...' : 'Generate Insights'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getTypeIcon(insight.insight_type)}</div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{insight.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {insight.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant={getImpactColor(insight.impact_level)}>
                      {insight.impact_level} impact
                    </Badge>
                    <Badge variant="outline">P{insight.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Affected Departments:</span>
                  </div>
                  {insight.affected_departments.map((dept) => (
                    <Badge key={dept} variant="secondary">
                      {dept}
                    </Badge>
                  ))}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Expected Impact
                  </h4>
                  <p className="text-sm text-muted-foreground">{insight.expected_impact}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Recommended Actions
                  </h4>
                  <ScrollArea className="h-auto max-h-40">
                    <div className="space-y-2">
                      {insight.recommended_actions?.map((action: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">{action.action}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                              <span>Owner: {action.owner}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {action.timeline}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Complexity: <Badge variant="outline">{insight.implementation_complexity}</Badge>
                    </span>
                    <span className="text-muted-foreground">
                      Confidence: {Math.round((insight.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {insight.status === 'identified' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(insight.id, 'under_review')}
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(insight.id, 'approved')}
                        >
                          Approve
                        </Button>
                      </>
                    )}
                    {insight.status === 'under_review' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(insight.id, 'approved')}
                      >
                        Approve
                      </Button>
                    )}
                    {insight.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(insight.id, 'in_progress')}
                      >
                        Start Implementation
                      </Button>
                    )}
                    {insight.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateStatus(insight.id, 'implemented')}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {(insight.status === 'identified' || insight.status === 'under_review') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(insight.id, 'dismissed')}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}