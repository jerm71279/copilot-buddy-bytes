import { ListCard } from "@/components/ui/list-card";
import { Play, Pause } from "lucide-react";
import { getStatusColor } from "@/lib/automationConfig";

interface WorkflowListCardProps {
  workflow: any;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export const WorkflowListCard = ({ workflow, onToggleStatus }: WorkflowListCardProps) => {
  return (
    <ListCard
      item={workflow}
      title={workflow.workflow_name}
      description={(item) => item.description || "No description"}
      metadata={[
        (item) => `Type: ${item.workflow_type.replace('_', ' ')}`,
        (item) => `Created ${new Date(item.created_at).toLocaleDateString()}`
      ]}
      badges={[
        (item) => ({
          label: item.is_active ? 'Active' : 'Inactive',
          variant: getStatusColor(item.is_active) as any
        })
      ]}
      actions={[
        {
          label: workflow.is_active ? 'Pause' : 'Activate',
          icon: workflow.is_active ? Pause : Play,
          variant: 'outline',
          onClick: (e) => {
            e.stopPropagation();
            onToggleStatus(workflow.id, workflow.is_active);
          }
        }
      ]}
      className="hover:shadow-md transition-shadow"
    />
  );
};
