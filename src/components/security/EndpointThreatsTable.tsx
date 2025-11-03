import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle } from "lucide-react";

interface EndpointThreat {
  id: string;
  threat_name: string;
  threat_type: string;
  severity: string;
  status: string;
  detected_at: string;
  endpoints?: { hostname: string };
}

interface EndpointThreatsTableProps {
  threats: EndpointThreat[];
  isLoading: boolean;
}

export function EndpointThreatsTable({ threats, isLoading }: EndpointThreatsTableProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading threats...</div>;
  }

  if (!threats.length) {
    return <div className="text-center py-8 text-muted-foreground">No threats detected</div>;
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Threat Name</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Detected</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {threats.map((threat) => (
            <TableRow key={threat.id}>
              <TableCell className="font-medium">{threat.threat_name}</TableCell>
              <TableCell>{threat.endpoints?.hostname || "Unknown"}</TableCell>
              <TableCell>{threat.threat_type}</TableCell>
              <TableCell>
                <Badge variant={getSeverityVariant(threat.severity)}>
                  {threat.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={threat.status === "resolved" ? "outline" : "default"}>
                  {threat.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(threat.detected_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                {threat.status === "detected" && (
                  <Button size="sm" variant="outline">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
