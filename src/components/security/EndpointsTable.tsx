import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface Endpoint {
  id: string;
  hostname: string;
  ip_address: string | null;
  os_type: string;
  os_version: string | null;
  status: string;
  risk_score: number;
  last_seen: string | null;
}

interface EndpointsTableProps {
  endpoints: Endpoint[];
  isLoading: boolean;
}

export function EndpointsTable({ endpoints, isLoading }: EndpointsTableProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading endpoints...</div>;
  }

  if (!endpoints.length) {
    return <div className="text-center py-8 text-muted-foreground">No endpoints found</div>;
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "offline": return "secondary";
      case "at_risk": return "destructive";
      default: return "outline";
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 40) return "text-warning";
    return "text-primary";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hostname</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>OS</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {endpoints.map((endpoint) => (
            <TableRow key={endpoint.id}>
              <TableCell className="font-medium">{endpoint.hostname}</TableCell>
              <TableCell>{endpoint.ip_address || "N/A"}</TableCell>
              <TableCell>
                {endpoint.os_type} {endpoint.os_version && `(${endpoint.os_version})`}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(endpoint.status)}>
                  {endpoint.status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={getRiskColor(endpoint.risk_score)}>
                  {endpoint.risk_score}/100
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {endpoint.last_seen 
                  ? formatDistanceToNow(new Date(endpoint.last_seen), { addSuffix: true })
                  : "Never"
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
