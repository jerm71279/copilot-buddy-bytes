import { QuickActionButtonGroup, QuickActionButton } from "@/components/ui/quick-action-button-group";
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
  const handleAction = (mutation: any) => {
    if (!customerId) {
      toast.error('Please assign a customer to your profile first');
      return;
    }
    mutation.mutate();
  };

  const actionButtons: QuickActionButton[] = quickActions.map((action) => {
    const mutation = action.action === 'aggregate' 
      ? aggregateMetricsMutation
      : action.action === 'generate'
      ? generateReportMutation
      : checkBenchmarksMutation;

    return {
      id: action.action,
      label: action.label,
      icon: action.icon,
      variant: action.variant,
      onClick: () => handleAction(mutation),
      disabled: mutation.isPending,
      loading: mutation.isPending
    };
  });

  return (
    <QuickActionButtonGroup
      title="Quick Actions"
      description="Run analytics operations"
      actions={actionButtons}
    />
  );
};
