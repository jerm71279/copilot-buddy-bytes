import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { FinancialMetrics } from "@/hooks/useFinanceData";
import { getAdditionalMetrics } from "@/lib/financeConfig";

interface AdditionalMetricsCardsProps {
  stats: FinancialMetrics;
}

export const AdditionalMetricsCards = ({ stats }: AdditionalMetricsCardsProps) => {
  const additionalMetrics = getAdditionalMetrics(stats);

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-3">
        {additionalMetrics.map((metric, idx) => (
          <Card key={idx}>
            <CardHeader className={metric.breakdown ? '' : 'flex flex-row items-center justify-between space-y-0 pb-2'}>
              {metric.breakdown ? (
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    {metric.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <pre className="text-xs whitespace-pre-wrap font-mono">{metric.tooltip}</pre>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {metric.icon && <metric.icon className={`h-4 w-4 ${metric.color}`} />}
                </>
              )}
            </CardHeader>
            <CardContent className={metric.breakdown ? 'space-y-2' : ''}>
              {metric.breakdown ? (
                metric.breakdown.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className="font-medium">${item.value.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {metric.description && (
                    <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Annual Projections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ARR:</span>
              <span className="font-medium">${(stats.mrr * 12).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Projected Growth:</span>
              <span className="font-medium">${(stats.mrr * 12 * (stats.growth / 100)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Year-End Target:</span>
              <span className="font-medium">${(stats.mrr * 12 * (1 + stats.growth / 100)).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
