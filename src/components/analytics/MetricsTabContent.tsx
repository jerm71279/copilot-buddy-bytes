import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { metricTypeLabels, metricIcons } from "@/lib/analyticsConfig";

interface MetricsTabContentProps {
  getMetricsByType: (type: string) => any[];
}

export const MetricsTabContent = ({ getMetricsByType }: MetricsTabContentProps) => {
  return (
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
  );
};
