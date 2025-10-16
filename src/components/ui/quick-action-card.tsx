import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export interface QuickActionConfig {
  id?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  buttonLabel?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface QuickActionCardProps {
  config: QuickActionConfig;
}

export function QuickActionCard({ config }: QuickActionCardProps) {
  const Icon = config.icon;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={!config.disabled && !config.loading ? config.onClick : undefined}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {config.title}
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      {config.buttonLabel && (
        <CardContent>
          <Button 
            variant={config.variant || "outline"}
            className="w-full"
            disabled={config.disabled || config.loading}
          >
            {config.buttonLabel}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
