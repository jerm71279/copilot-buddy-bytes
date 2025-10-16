import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { quickActions } from "@/lib/analyticsConfig";

interface AnalyticsQuickActionsProps {
  customerId: string | null;
  aggregateMetricsMutation: any;
  generateReportMutation: any;
  checkBenchmarksMutation: any;
}

export const AnalyticsQuickActions = ({
  customerId,
  aggregateMetricsMutation,
  generateReportMutation,
  checkBenchmarksMutation
}: AnalyticsQuickActionsProps) => {
  const handleAction = (action: string, mutation: any) => {
    if (!customerId) {
      toast.error('Please assign a customer to your profile first');
      return;
    }
    mutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Run analytics operations</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const mutation = action.action === 'aggregate' 
            ? aggregateMetricsMutation
            : action.action === 'generate'
            ? generateReportMutation
            : checkBenchmarksMutation;

          return (
            <Button
              key={action.action}
              onClick={() => handleAction(action.action, mutation)}
              disabled={mutation.isPending}
              variant={action.variant}
            >
              <Icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
