/**
 * EmptyState Component
 * Reusable empty state card for consistent UX across the platform
 * Eliminates duplicate empty state patterns
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) => {
  return (
    <Card className={className}>
      <CardContent className="py-12 text-center">
        <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant={action.variant || "default"}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
