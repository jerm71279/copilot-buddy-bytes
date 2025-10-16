import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric) => {
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
              <div className="text-2xl font-bold">
                {metric.title === "Workflow Efficiency" ? `${value}%` : value}
              </div>
              {metric.title === "Workflow Efficiency" && (
                <Progress value={value} className="mt-2" />
              )}
              {badge && <Badge variant={badge.variant} className="mt-1">{badge.text}</Badge>}
              {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
