import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { FinancialMetrics } from "@/hooks/useFinanceData";
import { getFinanceMetricCards } from "@/lib/financeConfig";

interface FinanceMetricCardsProps {
  stats: FinancialMetrics;
}

export const FinanceMetricCards = ({ stats }: FinanceMetricCardsProps) => {
  const navigate = useNavigate();
  const metricCards = getFinanceMetricCards(stats);

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card 
            key={card.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(card.clickPath)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                {card.tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{card.tooltip}</pre>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.valueColor || ''}`}>{card.value}</div>
              {card.badges && (
                <div className="flex gap-2 mt-1 flex-wrap">
                  {card.badges.map((badge, i) => (
                    <Badge key={i} variant={badge.variant} className="text-xs">
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              )}
              {card.description && (
                <p className={`text-xs mt-1 ${card.descriptionColor || 'text-muted-foreground'}`}>
                  {card.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};
