import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import MCPServerStatus from "@/components/MCPServerStatus";
import { toast } from "sonner";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { 
  metricCards, 
  quickActions, 
  metricTypeLabels,
  getAlertSeverityColor,
  getAlertBadgeVariant,
  getBenchmarkBadgeVariant,
  getReportStatusBadgeVariant,
  metricIcons
} from "@/lib/analyticsConfig";

export default function AnalyticsPortal() {
  const [period, setPeriod] = useState("daily");
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.customer_id) {
          setCustomerId(profile.customer_id);
        }
      }
    };
    fetchUser();
  }, []);

  const {
    metrics,
    alerts,
    benchmarks,
    reports,
    criticalAlerts,
    unmetBenchmarks,
    getMetricsByType,
    aggregateMetricsMutation,
    generateReportMutation,
    checkBenchmarksMutation,
    acknowledgeAlertMutation,
  } = useAnalyticsData(customerId, period);

  const handleAction = (action: string, mutation: any) => {
    if (!customerId) {
      toast.error('Please assign a customer to your profile first');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Analytics Portal</h1>
            <p className="text-muted-foreground mt-2">
              Real-time monitoring and comprehensive reporting
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <DashboardSettingsMenu dashboardName="Analytics" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {metricCards.map((card) => {
            const Icon = card.icon;
            const value = card.getValue({ metrics, alerts, benchmarks, reports });
            const description = card.getDescription 
              ? card.getDescription({ criticalAlerts, unmetBenchmarks })
              : card.description;

            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${card.iconClassName || 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Run analytics operations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const mutation = action.action === 'aggregate' 
                ? aggregateMetricsMutation
                : action.action === 'generate'
                ? generateReportMutation
                : checkBenchmarksMutation;

              return (
                <Button
                  key={action.action}
                  onClick={() => handleAction(action.action, mutation)}
                  disabled={mutation.isPending}
                  variant={action.variant}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Aggregated performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.keys(metricTypeLabels).map((type) => {
                    const typeMetrics = getMetricsByType(type);
                    if (typeMetrics.length === 0) return null;

                    return (
                      <div key={type} className="space-y-2">
                        <h3 className="font-semibold">{metricTypeLabels[type]}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {typeMetrics.map((metric: any) => (
                            <Card key={metric.id}>
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {metric.metric_name.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-2xl font-bold">
                                      {metric.metric_value.toFixed(1)}
                                      {metric.metric_unit && <span className="text-sm ml-1">{metric.metric_unit}</span>}
                                    </p>
                                  </div>
                                  <metricIcons.Activity className="h-8 w-8 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Alerts</CardTitle>
                <CardDescription>Active system alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts && alerts.length > 0 ? (
                    alerts.map((alert: any) => (
                      <Card key={alert.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <metricIcons.AlertCircle className={`h-5 w-5 mt-1 ${getAlertSeverityColor(alert.alert_severity)}`} />
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{alert.alert_title}</h4>
                                  <Badge variant={getAlertBadgeVariant(alert.alert_severity)}>
                                    {alert.alert_severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {alert.alert_message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(alert.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {!alert.is_acknowledged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No active alerts
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmarks">
            <Card>
              <CardHeader>
                <CardTitle>Performance Benchmarks</CardTitle>
                <CardDescription>Track performance targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benchmarks && benchmarks.length > 0 ? (
                    benchmarks.map((benchmark: any) => (
                      <Card key={benchmark.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{benchmark.benchmark_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Category: {benchmark.benchmark_category}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm">
                                  Target: {benchmark.target_value} {benchmark.unit}
                                </span>
                                {benchmark.current_value && (
                                  <span className="text-sm">
                                    Current: {benchmark.current_value} {benchmark.unit}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant={getBenchmarkBadgeVariant(benchmark.status)}>
                              {benchmark.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No benchmarks configured
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>Historical reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports && reports.length > 0 ? (
                    reports.map((report: any) => (
                      <Card key={report.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{report.report_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Type: {report.report_type}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Generated: {new Date(report.generated_at).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Period: {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={getReportStatusBadgeVariant(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No reports generated yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2">
          <DepartmentAIAssistant department="analytics" departmentLabel="Analytics" />
          <MCPServerStatus filterByServerType="analytics" />
        </div>
      </main>
    </div>
  );
}