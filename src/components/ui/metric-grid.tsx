import { useNavigate } from "react-router-dom";
import { MetricCard, MetricCardConfig } from "./metric-card";

interface MetricGridProps {
  metrics: MetricCardConfig[];
  columns?: 2 | 3 | 4;
}

export function MetricGrid({ metrics, columns = 4 }: MetricGridProps) {
  const navigate = useNavigate();

  const gridClass = `grid gap-4 md:grid-cols-2 ${
    columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
  }`;

  return (
    <div className={gridClass}>
      {metrics.map((metric) => (
        <MetricCard 
          key={metric.title}
          config={metric}
          onNavigate={navigate}
        />
      ))}
    </div>
  );
}
