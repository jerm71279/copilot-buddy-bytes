import { Card, CardContent } from "@/components/ui/card";
import { ListCard, ListCardConfig } from "./list-card";
import type { LucideIcon } from "lucide-react";

export interface ListContainerConfig<T> {
  items: T[];
  itemConfig: Omit<ListCardConfig<T>, 'item'>;
  emptyState?: {
    icon?: LucideIcon;
    title: string;
    description: string;
  };
  spacing?: 2 | 4 | 6;
}

export function ListContainer<T>({
  items,
  itemConfig,
  emptyState,
  spacing = 2
}: ListContainerConfig<T>) {
  if (items.length === 0 && emptyState) {
    const EmptyIcon = emptyState.icon;
    return (
      <Card>
        <CardContent className="py-12 text-center">
          {EmptyIcon && <EmptyIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />}
          <h3 className="text-lg font-semibold mb-2">{emptyState.title}</h3>
          <p className="text-muted-foreground">{emptyState.description}</p>
        </CardContent>
      </Card>
    );
  }

  const spacingClass = `space-y-${spacing}`;

  return (
    <div className={spacingClass}>
      {items.map((item, index) => (
        <ListCard
          key={index}
          item={item}
          {...itemConfig}
        />
      ))}
    </div>
  );
}
