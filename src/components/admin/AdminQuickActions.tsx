import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickActionCard } from "@/lib/adminConfig";

interface AdminQuickActionsProps {
  quickActionCards: QuickActionCard[];
}

export function AdminQuickActions({ quickActionCards }: AdminQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActionCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.id}
            className="cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={card.onClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {card.title}
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
