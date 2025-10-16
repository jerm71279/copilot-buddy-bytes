import { MetricGrid } from "@/components/ui/metric-grid";
import { metricCards } from "@/lib/operationsConfig";

interface OperationsMetricCardsProps {
  stats: {
    workflows: number;
    mlInsights: number;
    efficiency: number;
    bottlenecks: number;
  };
}

export function OperationsMetricCards({ stats }: OperationsMetricCardsProps) {
  const metricsData = metricCards.map((metric) => {
    const value = metric.getValue(stats);
    const isEfficiency = metric.title === "Workflow Efficiency";

    return {
      title: metric.title,
      value: isEfficiency ? `${value}%` : value,
      icon: metric.icon,
      badge: metric.getBadge?.(stats) ? {
        label: metric.getBadge!(stats).text,
        variant: metric.getBadge!(stats).variant
      } : undefined,
      description: metric.getSubtext?.(stats),
      showProgress: isEfficiency,
      progress: isEfficiency ? value as number : undefined,
      onClickPath: metric.path
    };
  });

  return <MetricGrid metrics={metricsData} columns={4} />;
}
