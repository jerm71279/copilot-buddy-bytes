import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";

export interface ListItemBadge {
  label: string;
  variant?: BadgeProps["variant"];
  className?: string;
}

export interface ListItemAction {
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  onClick: (e: React.MouseEvent) => void;
}

export interface ListCardConfig<T> {
  item: T;
  title: string | ((item: T) => string);
  subtitle?: string | ((item: T) => string);
  description?: string | ((item: T) => string);
  metadata?: Array<string | ((item: T) => string)>;
  badges?: Array<ListItemBadge | ((item: T) => ListItemBadge)>;
  icon?: React.ReactNode | ((item: T) => React.ReactNode);
  actions?: Array<ListItemAction>;
  onClick?: (item: T) => void;
  className?: string;
  errorMessage?: string | ((item: T) => string | undefined);
}

export function ListCard<T>({
  item,
  title,
  subtitle,
  description,
  metadata,
  badges,
  icon,
  actions,
  onClick,
  className = "",
  errorMessage
}: ListCardConfig<T>) {
  const getStringValue = (value: string | ((item: T) => string)): string => {
    return typeof value === 'function' ? value(item) : value;
  };

  const getBadgeValue = (badge: ListItemBadge | ((item: T) => ListItemBadge)): ListItemBadge => {
    return typeof badge === 'function' ? badge(item) : badge;
  };

  const titleValue = getStringValue(title);
  const subtitleValue = subtitle ? getStringValue(subtitle) : undefined;
  const descriptionValue = description ? getStringValue(description) : undefined;
  const errorValue = errorMessage ? (typeof errorMessage === 'function' ? errorMessage(item) : errorMessage) : undefined;

  const iconElement = icon ? (typeof icon === 'function' ? icon(item) : icon) : null;

  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick ? () => onClick(item) : undefined}
    >
      <CardContent className="py-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 flex-1">
            {iconElement}
            <div className="flex-1">
              {badges && badges.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  {badges.map((badge, index) => {
                    const badgeValue = getBadgeValue(badge);
                    return (
                      <Badge
                        key={index}
                        variant={badgeValue.variant}
                        className={badgeValue.className}
                      >
                        {badgeValue.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              <p className="font-semibold text-base">{titleValue}</p>
              
              {subtitleValue && (
                <p className="text-sm text-muted-foreground mt-1">{subtitleValue}</p>
              )}
              
              {descriptionValue && (
                <p className="text-sm text-muted-foreground mb-2">{descriptionValue}</p>
              )}
              
              {metadata && metadata.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  {metadata.map((meta, index) => (
                    <span key={index}>
                      {index > 0 && <span className="mx-1">•</span>}
                      {getStringValue(meta)}
                    </span>
                  ))}
                </div>
              )}
              
              {errorValue && (
                <p className="text-sm text-destructive mt-2 p-2 bg-destructive/5 rounded">
                  {errorValue}
                </p>
              )}
            </div>
          </div>
          
          {actions && actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant={action.variant || "outline"}
                    size="sm"
                    onClick={action.onClick}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
