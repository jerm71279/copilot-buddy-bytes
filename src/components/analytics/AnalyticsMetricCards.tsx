import { MetricGrid } from "@/components/ui/metric-grid";
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
  const metricsData = metricCards.map((card) => ({
    title: card.title,
    value: card.getValue({ metrics, alerts, benchmarks, reports }),
    icon: card.icon,
    iconClassName: card.iconClassName,
    description: card.getDescription 
      ? card.getDescription({ criticalAlerts, unmetBenchmarks })
      : card.description,
    clickable: false
  }));

  return <MetricGrid metrics={metricsData} columns={4} />;
};
