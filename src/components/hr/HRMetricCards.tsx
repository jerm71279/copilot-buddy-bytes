import { MetricGrid } from "@/components/ui/metric-grid";
import { HRStats } from "@/hooks/useHRData";
import { getHRMetricCards } from "@/lib/hrConfig";

interface HRMetricCardsProps {
  stats: HRStats;
}

export const HRMetricCards = ({ stats }: HRMetricCardsProps) => {
  const metricCards = getHRMetricCards(stats);

  const metricsData = metricCards.map((card) => ({
    title: card.title,
    value: card.value,
    icon: card.icon,
    color: card.color,
    badge: card.badge,
    description: card.description,
    onClickPath: card.clickPath
  }));

  return <MetricGrid metrics={metricsData} columns={4} />;
};
