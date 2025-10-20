import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Lightbulb, TrendingUp, AlertTriangle, Target, CheckCircle, XCircle } from "lucide-react";

interface DepartmentInsight {
  id: string;
  customer_id: string;
  department: string;
  insight_type: 'pattern' | 'bottleneck' | 'opportunity' | 'risk' | 'knowledge_gap';
  title: string;
  description: string;
  confidence_score: number;
  impact_score: number;
  affected_users: number;
  frequency_count: number;
  status: 'new' | 'acknowledged' | 'acted_upon' | 'dismissed';
  created_at: string;
  metadata: any;
}

const insightTypeConfig = {
  knowledge_gap: { icon: Lightbulb, color: "text-[hsl(var(--blue))]", bgColor: "bg-[hsl(var(--blue))]/10", label: "Knowledge Gap" },
  pattern: { icon: TrendingUp, color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success))]/10", label: "Pattern" },
  bottleneck: { icon: AlertTriangle, color: "text-[hsl(var(--orange))]", bgColor: "bg-[hsl(var(--orange))]/10", label: "Bottleneck" },
  opportunity: { icon: Target, color: "text-[hsl(var(--violet))]", bgColor: "bg-[hsl(var(--violet))]/10", label: "Opportunity" },
  risk: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Risk" },
};

export default function DepartmentInsights() {
  const [insights, setInsights] = useState<DepartmentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchInsights();
  }, [selectedDepartment, selectedStatus]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("department_insights")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedDepartment !== "all") {
        query = query.eq("department", selectedDepartment);
      }

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInsights((data || []) as DepartmentInsight[]);
    } catch (error: any) {
      toast.error("Failed to load insights: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateInsightStatus = async (insightId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("department_insights")
        .update({ status: newStatus })
        .eq("id", insightId);

      if (error) throw error;
      
      toast.success("Insight status updated");
      fetchInsights();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const getInsightIcon = (type: string) => {
    const config = insightTypeConfig[type as keyof typeof insightTypeConfig];
    const Icon = config?.icon || Lightbulb;
    return <Icon className={`h-5 w-5 ${config?.color || 'text-gray-500'}`} />;
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-primary">High Confidence</Badge>;
    if (score >= 0.6) return <Badge className="bg-warning">Medium Confidence</Badge>;
    return <Badge variant="secondary">Low Confidence</Badge>;
  };

  const getImpactBadge = (score: number) => {
    if (score >= 8) return <Badge variant="destructive">High Impact</Badge>;
    if (score >= 5) return <Badge className="bg-warning">Medium Impact</Badge>;
    return <Badge variant="outline">Low Impact</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Department Insights</h1>
        <p className="text-muted-foreground">
          AI-generated insights from departmental conversations and patterns
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="it">IT</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="executive">Executive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="acted_upon">Acted Upon</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={fetchInsights} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Insights</TabsTrigger>
          <TabsTrigger value="knowledge_gap">Knowledge Gaps</TabsTrigger>
          <TabsTrigger value="bottleneck">Bottlenecks</TabsTrigger>
          <TabsTrigger value="pattern">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Loading insights...</p>
              </CardContent>
            </Card>
          ) : insights.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No insights yet. The system will generate insights as users interact with departmental AI assistants.
                </p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getInsightIcon(insight.insight_type)}
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{insight.title}</CardTitle>
                        <CardDescription className="mb-3">{insight.description}</CardDescription>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{insight.department.toUpperCase()}</Badge>
                          <Badge variant="outline">{insightTypeConfig[insight.insight_type as keyof typeof insightTypeConfig]?.label}</Badge>
                          {getConfidenceBadge(insight.confidence_score)}
                          {getImpactBadge(insight.impact_score)}
                        </div>

                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>👥 {insight.affected_users} users</span>
                          <span>🔄 {insight.frequency_count}x detected</span>
                          <span>📅 {new Date(insight.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {insight.status === 'new' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateInsightStatus(insight.id, 'acknowledged')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateInsightStatus(insight.id, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </>
                      )}
                      {insight.status === 'acknowledged' && (
                        <Button
                          size="sm"
                          onClick={() => updateInsightStatus(insight.id, 'acted_upon')}
                        >
                          Mark as Acted Upon
                        </Button>
                      )}
                      {insight.status !== 'new' && (
                        <Badge variant={insight.status === 'acted_upon' ? 'default' : 'secondary'}>
                          {insight.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="knowledge_gap">
          {insights.filter(i => i.insight_type === 'knowledge_gap').length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No knowledge gap insights yet.</p>
              </CardContent>
            </Card>
          ) : (
            insights
              .filter(i => i.insight_type === 'knowledge_gap')
              .map(insight => (
                <Card key={insight.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{insight.title}</CardTitle>
                    <CardDescription>{insight.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="bottleneck">
          {insights.filter(i => i.insight_type === 'bottleneck').length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No bottleneck insights yet.</p>
              </CardContent>
            </Card>
          ) : (
            insights
              .filter(i => i.insight_type === 'bottleneck')
              .map(insight => (
                <Card key={insight.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{insight.title}</CardTitle>
                    <CardDescription>{insight.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="pattern">
          {insights.filter(i => i.insight_type === 'pattern').length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No pattern insights yet.</p>
              </CardContent>
            </Card>
          ) : (
            insights
              .filter(i => i.insight_type === 'pattern')
              .map(insight => (
                <Card key={insight.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{insight.title}</CardTitle>
                    <CardDescription>{insight.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
