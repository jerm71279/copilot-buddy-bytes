import { ListCard } from "@/components/ui/list-card";
import { getExecutionStatusColor, getExecutionIcon, getTriggerLabel } from "@/lib/automationConfig";

interface ExecutionListCardProps {
  execution: any;
  workflowName: string;
}

export const ExecutionListCard = ({ execution, workflowName }: ExecutionListCardProps) => {
  const duration = execution.completed_at
    ? ((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(1)
    : null;

  return (
    <ListCard
      item={execution}
      title={workflowName}
      subtitle={(item) => getTriggerLabel(item.triggered_by)}
      metadata={[
        (item) => `Started ${new Date(item.started_at).toLocaleString()}`,
        ...(duration ? [`Completed in ${duration}s`] : [])
      ]}
      badges={[
        (item) => ({
          label: item.status,
          variant: getExecutionStatusColor(item.status) as any
        })
      ]}
      icon={(item) => getExecutionIcon(item.status)}
      errorMessage={(item) => item.error_message}
    />
  );
};
