import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MetricCardConfig } from "@/lib/securityConfig";

interface SecurityMetricCardProps {
  config: MetricCardConfig;
  metrics: any;
  navigate?: any;
  showProgress?: boolean;
}

export function SecurityMetricCard({ config, metrics, navigate, showProgress }: SecurityMetricCardProps) {
  const Icon = config.icon;
  const value = config.getValue(metrics);
  const subtitle = config.subtitle?.(metrics);

  const handleClick = () => {
    if (config.onClick && navigate) {
      config.onClick(navigate);
    }
  };

  return (
    <Card 
      className={config.onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${config.className || ''}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {showProgress && config.id === 'compliance-score' && (
          <Progress value={metrics.complianceScore} className="mt-2" />
        )}
      </CardContent>
    </Card>
  );
}
