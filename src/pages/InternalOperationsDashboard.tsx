import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Award, TrendingUp, CheckCircle, AlertTriangle, Activity, Clock, MessageSquare } from "lucide-react";

const InternalOperationsDashboard = () => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["internal-operations-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_operations_metrics")
        .select("*")
        .order("metric_date", { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: champions } = useQuery({
    queryKey: ["employee-champions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_champions")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recentFeedback } = useQuery({
    queryKey: ["recent-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_feedback")
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const latestMetrics = metrics?.[0];
  const previousMetrics = metrics?.[1];

  const getMetricChange = (current?: number, previous?: number) => {
    if (!current || !previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (metricsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Internal Operations Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor internal deployment progress and employee engagement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics?.active_employees || 0}</div>
            {previousMetrics && (
              <p className="text-xs text-muted-foreground">
                {getMetricChange(latestMetrics?.active_employees, previousMetrics.active_employees) > 0 ? "+" : ""}
                {getMetricChange(latestMetrics?.active_employees, previousMetrics.active_employees).toFixed(1)}% from yesterday
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Training Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics?.training_completion_rate || 0}%</div>
            <Progress value={latestMetrics?.training_completion_rate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Platform Adoption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics?.platform_adoption_rate || 0}%</div>
            <Progress value={latestMetrics?.platform_adoption_rate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics?.readiness_score || 0}/100</div>
            {latestMetrics && latestMetrics.readiness_score >= 80 ? (
              <Badge className="mt-2 bg-green-500">Ready for Pilot</Badge>
            ) : (
              <Badge className="mt-2" variant="secondary">In Progress</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="champions">Champions</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Metrics</CardTitle>
                <CardDescription>Employee feedback and resolution rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Submissions this week</span>
                  <span className="font-bold">{latestMetrics?.feedback_submissions_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Resolution rate</span>
                  <span className="font-bold">{latestMetrics?.feedback_resolution_rate || 0}%</span>
                </div>
                <Progress value={latestMetrics?.feedback_resolution_rate || 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support Metrics</CardTitle>
                <CardDescription>Internal support ticket activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tickets created</span>
                  <span className="font-bold">{latestMetrics?.support_tickets_created || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tickets resolved</span>
                  <span className="font-bold">{latestMetrics?.support_tickets_resolved || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average session</span>
                  <span className="font-bold">{latestMetrics?.average_session_duration_minutes || 0} min</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>30-Day Trend</CardTitle>
              <CardDescription>Platform adoption and engagement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics?.slice(0, 7).map((metric, index) => (
                  <div key={metric.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(metric.metric_date).toLocaleDateString()}
                    </span>
                    <div className="flex gap-4">
                      <span>Active: {metric.active_employees}</span>
                      <span>Adoption: {metric.platform_adoption_rate}%</span>
                      <span>Readiness: {metric.readiness_score}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="champions" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {champions?.map(champion => (
              <Card key={champion.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Champion {champion.user_id}
                  </CardTitle>
                  <CardDescription>
                    {champion.department} • {champion.champion_type.replace("_", " ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{champion.contributions_count}</div>
                      <div className="text-xs text-muted-foreground">Contributions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{champion.feedback_provided_count}</div>
                      <div className="text-xs text-muted-foreground">Feedback</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{champion.training_sessions_led}</div>
                      <div className="text-xs text-muted-foreground">Sessions Led</div>
                    </div>
                  </div>
                  {champion.expertise_areas && champion.expertise_areas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {champion.expertise_areas.map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {recentFeedback?.map(feedback => (
            <Card key={feedback.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{feedback.title}</CardTitle>
                    <CardDescription>
                      Submitted {new Date(feedback.submitted_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{feedback.feedback_type}</Badge>
                    <Badge>{feedback.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feedback.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Security Training
                </CardTitle>
                <CardDescription>Employee security training completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {latestMetrics?.training_completion_rate || 0}%
                </div>
                <Progress value={latestMetrics?.training_completion_rate || 0} className="mb-4" />
                <p className="text-sm text-muted-foreground">
                  All employees must complete mandatory security training before production deployment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Security Acknowledgments
                </CardTitle>
                <CardDescription>Policy acknowledgment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {latestMetrics?.security_acknowledgment_rate || 0}%
                </div>
                <Progress value={latestMetrics?.security_acknowledgment_rate || 0} className="mb-4" />
                <p className="text-sm text-muted-foreground">
                  Employees must acknowledge all security policies before accessing customer data
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InternalOperationsDashboard;