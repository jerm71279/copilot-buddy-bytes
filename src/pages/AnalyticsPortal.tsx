import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import MCPServerStatus from "@/components/MCPServerStatus";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { 
  getAlertSeverityColor,
  getAlertBadgeVariant,
  getBenchmarkBadgeVariant,
  getReportStatusBadgeVariant,
  metricIcons
} from "@/lib/analyticsConfig";
import { AnalyticsMetricCards } from "@/components/analytics/AnalyticsMetricCards";
import { AnalyticsQuickActions } from "@/components/analytics/AnalyticsQuickActions";
import { MetricsTabContent } from "@/components/analytics/MetricsTabContent";

export default function AnalyticsPortal() {
  const [period, setPeriod] = useState("daily");
  const { customerId } = useUserProfile();

  const {
    metrics,
    alerts,
    benchmarks,
    reports,
    criticalAlerts,
    unmetBenchmarks,
    aggregateMetricsMutation,
    generateReportMutation,
    checkBenchmarksMutation,
    acknowledgeAlertMutation,
    getMetricsByType,
  } = useAnalyticsData(customerId, period);

  return (
    <DashboardLayout>
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

        <AnalyticsMetricCards
          metrics={metrics}
          alerts={alerts}
          benchmarks={benchmarks}
          reports={reports}
          criticalAlerts={criticalAlerts}
          unmetBenchmarks={unmetBenchmarks}
        />

        <AnalyticsQuickActions
          customerId={customerId}
          aggregateMetricsMutation={aggregateMetricsMutation}
          generateReportMutation={generateReportMutation}
          checkBenchmarksMutation={checkBenchmarksMutation}
        />

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <MetricsTabContent getMetricsByType={getMetricsByType} />
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
    </DashboardLayout>
  );
}