import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SecurityIncident } from "@/hooks/useSecurityData";
import { getSeverityColor, getStatusColor } from "@/lib/securityConfig";
import { AlertTriangle } from "lucide-react";

interface SecurityIncidentsListProps {
  incidents: SecurityIncident[];
  onIncidentClick?: (incident: SecurityIncident) => void;
}

export function SecurityIncidentsList({ incidents, onIncidentClick }: SecurityIncidentsListProps) {
  if (incidents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No incidents detected</h3>
          <p className="text-muted-foreground">Your security posture looks good</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {incidents.map((incident) => (
        <Card 
          key={incident.id}
          className={`cursor-pointer hover:shadow-md transition-shadow ${getSeverityColor(incident.severity)}`}
          onClick={() => onIncidentClick?.(incident)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                    {incident.severity.toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(incident.status)}>
                    {incident.status}
                  </Badge>
                </div>
                <p className="font-semibold mb-1">{incident.type}</p>
                <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(incident.timestamp).toLocaleString()}</span>
                  <span>•</span>
                  <span>{incident.affectedSystems.join(', ')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
