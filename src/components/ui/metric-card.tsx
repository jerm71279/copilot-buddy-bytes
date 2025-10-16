import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, type LucideIcon } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";

export interface MetricBadge {
  label: string;
  variant?: BadgeProps["variant"];
}

export interface MetricCardConfig {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  color?: string;
  valueColor?: string;
  description?: string;
  descriptionColor?: string;
  tooltip?: string;
  badge?: MetricBadge;
  badges?: MetricBadge[];
  progress?: number;
  showProgress?: boolean;
  clickable?: boolean;
  onClickPath?: string;
  onClick?: () => void;
}

interface MetricCardProps {
  config: MetricCardConfig;
  onNavigate?: (path: string) => void;
}

export function MetricCard({ config, onNavigate }: MetricCardProps) {
  const Icon = config.icon;
  const isClickable = config.clickable !== false && (config.onClickPath || config.onClick);

  const handleClick = () => {
    if (config.onClick) {
      config.onClick();
    } else if (config.onClickPath && onNavigate) {
      onNavigate(config.onClickPath);
    }
  };

  return (
    <Card 
      className={isClickable ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}
      onClick={isClickable ? handleClick : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
          {config.tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <pre className="text-xs whitespace-pre-wrap font-mono">{config.tooltip}</pre>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Icon className={`h-4 w-4 ${config.iconClassName || config.color || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${config.valueColor || ''}`}>
          {config.value}
        </div>
        
        {config.showProgress && config.progress !== undefined && (
          <Progress value={config.progress} className="mt-2" />
        )}

        {config.badge && (
          <Badge variant={config.badge.variant} className="mt-1">
            {config.badge.label}
          </Badge>
        )}
        
        {config.badges && config.badges.length > 0 && (
          <div className="flex gap-2 mt-1 flex-wrap">
            {config.badges.map((badge, i) => (
              <Badge key={i} variant={badge.variant} className="text-xs">
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
        
        {config.description && (
          <p className={`text-xs mt-1 ${config.descriptionColor || 'text-muted-foreground'}`}>
            {config.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
