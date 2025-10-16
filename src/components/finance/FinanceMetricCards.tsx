import { MetricGrid } from "@/components/ui/metric-grid";
import { FinancialMetrics } from "@/hooks/useFinanceData";
import { getFinanceMetricCards } from "@/lib/financeConfig";

interface FinanceMetricCardsProps {
  stats: FinancialMetrics;
}

export const FinanceMetricCards = ({ stats }: FinanceMetricCardsProps) => {
  const metricCards = getFinanceMetricCards(stats);

  const metricsData = metricCards.map((card) => ({
    title: card.title,
    value: card.value,
    icon: card.icon,
    color: card.color,
    valueColor: card.valueColor,
    description: card.description,
    descriptionColor: card.descriptionColor,
    tooltip: card.tooltip,
    badges: card.badges,
    onClickPath: card.clickPath
  }));

  return <MetricGrid metrics={metricsData} columns={4} />;
};
