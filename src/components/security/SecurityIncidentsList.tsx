import { ListContainer } from "@/components/ui/list-container";
import { SecurityIncident } from "@/hooks/useSecurityData";
import { getSeverityColor, getStatusColor } from "@/lib/securityConfig";
import { AlertTriangle } from "lucide-react";

interface SecurityIncidentsListProps {
  incidents: SecurityIncident[];
  onIncidentClick?: (incident: SecurityIncident) => void;
}

export function SecurityIncidentsList({ incidents, onIncidentClick }: SecurityIncidentsListProps) {
  return (
    <ListContainer
      items={incidents}
      emptyState={{
        icon: AlertTriangle,
        title: "No incidents detected",
        description: "Your security posture looks good"
      }}
      itemConfig={{
        title: (item) => item.type,
        description: (item) => item.description,
        metadata: [
          (item) => new Date(item.timestamp).toLocaleString(),
          (item) => item.affectedSystems.join(', ')
        ],
        badges: [
          (item) => ({
            label: item.severity.toUpperCase(),
            variant: "outline",
            className: getSeverityColor(item.severity)
          }),
          (item) => ({
            label: item.status,
            className: getStatusColor(item.status)
          })
        ],
        onClick: onIncidentClick
      }}
    />
  );
}
