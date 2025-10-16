import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { itMetricCards } from "@/lib/itConfig";
import type { ITStats } from "@/hooks/useITData";

interface ITMetricCardsProps {
  stats: ITStats;
}

export function ITMetricCards({ stats }: ITMetricCardsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {itMetricCards.map((metric) => {
        const Icon = metric.icon;
        const value = metric.getValue(stats);
        const badge = metric.getBadge?.(stats);
        const subtext = metric.getSubtext?.(stats);

        return (
          <Card 
            key={metric.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(metric.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.valueColor || ''}`}>
                {value}
              </div>
              {badge && <Badge variant={badge.variant} className="mt-1">{badge.text}</Badge>}
              {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
