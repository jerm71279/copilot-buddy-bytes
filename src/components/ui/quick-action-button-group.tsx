import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export interface QuickActionButton {
  id?: string;
  label: string;
  icon: LucideIcon;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface QuickActionButtonGroupProps {
  title: string;
  description: string;
  actions: QuickActionButton[];
}

export function QuickActionButtonGroup({ title, description, actions }: QuickActionButtonGroupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id || action.label}
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              variant={action.variant || "default"}
            >
              <Icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
