import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { metricCards } from "@/lib/analyticsConfig";

interface AnalyticsMetricCardsProps {
  metrics: any[];
  alerts: any[];
  benchmarks: any[];
  reports: any[];
  criticalAlerts: number;
  unmetBenchmarks: number;
}

export const AnalyticsMetricCards = ({
  metrics,
  alerts,
  benchmarks,
  reports,
  criticalAlerts,
  unmetBenchmarks
}: AnalyticsMetricCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
  );
};
