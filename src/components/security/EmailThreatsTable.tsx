import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Shield } from "lucide-react";

interface EmailThreat {
  id: string;
  threat_type: string;
  severity: string;
  status: string;
  subject: string | null;
  sender: string;
  recipient: string;
  detected_at: string;
  email_accounts?: { email_address: string };
}

interface EmailThreatsTableProps {
  threats: EmailThreat[];
  isLoading: boolean;
}

export function EmailThreatsTable({ threats, isLoading }: EmailThreatsTableProps) {
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
            <TableHead>Subject</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Recipient</TableHead>
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
              <TableCell className="font-medium max-w-xs truncate">
                {threat.subject || "No Subject"}
              </TableCell>
              <TableCell className="truncate max-w-xs">{threat.sender}</TableCell>
              <TableCell className="truncate max-w-xs">
                {threat.email_accounts?.email_address || threat.recipient}
              </TableCell>
              <TableCell>{threat.threat_type}</TableCell>
              <TableCell>
                <Badge variant={getSeverityVariant(threat.severity)}>
                  {threat.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={threat.status === "blocked" ? "outline" : "destructive"}>
                  {threat.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(threat.detected_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                {threat.status === "detected" && (
                  <Button size="sm" variant="outline">
                    <Shield className="h-4 w-4 mr-1" />
                    Block
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
