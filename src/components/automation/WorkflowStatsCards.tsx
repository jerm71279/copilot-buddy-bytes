import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statCards } from "@/lib/automationConfig";

interface WorkflowStatsCardsProps {
  stats: {
    total: number;
    active: number;
    successRate: number;
    executions: number;
  };
}

export const WorkflowStatsCards = ({ stats }: WorkflowStatsCardsProps) => {
  const mappedStats = {
    totalWorkflows: stats.total,
    activeWorkflows: stats.active,
    successRate: stats.successRate,
    totalExecutions: stats.executions
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statCards.map(({ icon: Icon, label, key, suffix = '', colorClass = '' }) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colorClass}`}>
              {mappedStats[key]}{suffix}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
