import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HRStats } from "@/hooks/useHRData";
import { getHRMetricCards } from "@/lib/hrConfig";

interface HRMetricCardsProps {
  stats: HRStats;
}

export const HRMetricCards = ({ stats }: HRMetricCardsProps) => {
  const navigate = useNavigate();
  const metricCards = getHRMetricCards(stats);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((card) => (
        <Card
          key={card.title}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(card.clickPath)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.badge && (
              <Badge variant={card.badge.variant} className="mt-1">
                {card.badge.label}
              </Badge>
            )}
            {card.description && (
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
