import { DataTable, TableColumn } from "@/components/ui/data-table";
import { Receipt } from "lucide-react";

interface RevioInvoicesTableProps {
  revioData: any;
  revioLoading: boolean;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
}

export const RevioInvoicesTable = ({ revioData, revioLoading }: RevioInvoicesTableProps) => {
  const invoices: InvoiceRow[] = revioData?.invoices || [];

  const columns: TableColumn<InvoiceRow>[] = [
    {
      header: "Invoice #",
      accessor: "invoice_number",
      className: "font-medium"
    },
    {
      header: "Customer",
      accessor: "customer_name"
    },
    {
      header: "Amount",
      accessor: (row: InvoiceRow) => `$${row.amount.toLocaleString()}`
    },
    {
      header: "Status",
      accessor: "status",
      badge: {
        variant: (value) =>
          value === 'paid' ? 'default' :
          value === 'overdue' ? 'destructive' :
          'secondary'
      }
    },
    {
      header: "Issue Date",
      accessor: (row: InvoiceRow) => new Date(row.issue_date).toLocaleDateString()
    },
    {
      header: "Due Date",
      accessor: (row: InvoiceRow) => new Date(row.due_date).toLocaleDateString()
    }
  ];

  return (
    <DataTable
      title="Revio Invoices"
      description={revioLoading ? "Loading invoice data..." : "Recent invoices from Revio billing system"}
      icon={Receipt}
      data={invoices}
      isLoading={revioLoading}
      emptyMessage="No invoices available"
      columns={columns}
    />
  );
};
