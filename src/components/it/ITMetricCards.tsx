import { MetricGrid } from "@/components/ui/metric-grid";
import { itMetricCards } from "@/lib/itConfig";
import type { ITStats } from "@/hooks/useITData";

interface ITMetricCardsProps {
  stats: ITStats;
}

export function ITMetricCards({ stats }: ITMetricCardsProps) {
  const metricsData = itMetricCards.map((metric) => ({
    title: metric.title,
    value: metric.getValue(stats),
    icon: metric.icon,
    valueColor: metric.valueColor,
    badge: metric.getBadge?.(stats) ? {
      label: metric.getBadge!(stats).text,
      variant: metric.getBadge!(stats).variant
    } : undefined,
    description: metric.getSubtext?.(stats),
    onClickPath: metric.path
  }));

  return <MetricGrid metrics={metricsData} columns={4} />;
}
