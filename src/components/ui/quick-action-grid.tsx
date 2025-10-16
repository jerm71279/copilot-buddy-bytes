import { QuickActionCard, QuickActionConfig } from "./quick-action-card";

interface QuickActionGridProps {
  actions: QuickActionConfig[];
  columns?: 2 | 3 | 4;
}

export function QuickActionGrid({ actions, columns = 3 }: QuickActionGridProps) {
  const gridClass = `grid gap-4 ${
    columns === 2 ? 'md:grid-cols-2' : 
    columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
    'md:grid-cols-2 lg:grid-cols-4'
  }`;

  return (
    <div className={gridClass}>
      {actions.map((action) => (
        <QuickActionCard 
          key={action.id || action.title}
          config={action}
        />
      ))}
    </div>
  );
}
