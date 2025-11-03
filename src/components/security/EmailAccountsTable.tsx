import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface EmailAccount {
  id: string;
  email_address: string;
  display_name: string | null;
  account_type: string;
  is_monitored: boolean;
  threat_count: number;
  last_scan: string | null;
}

interface EmailAccountsTableProps {
  accounts: EmailAccount[];
  isLoading: boolean;
}

export function EmailAccountsTable({ accounts, isLoading }: EmailAccountsTableProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>;
  }

  if (!accounts.length) {
    return <div className="text-center py-8 text-muted-foreground">No email accounts found</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email Address</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Threat Count</TableHead>
            <TableHead>Last Scan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.email_address}</TableCell>
              <TableCell>{account.display_name || "N/A"}</TableCell>
              <TableCell>{account.account_type}</TableCell>
              <TableCell>
                <Badge variant={account.is_monitored ? "default" : "secondary"}>
                  {account.is_monitored ? "Monitored" : "Unmonitored"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={account.threat_count > 0 ? "destructive" : "outline"}>
                  {account.threat_count}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {account.last_scan 
                  ? formatDistanceToNow(new Date(account.last_scan), { addSuffix: true })
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
