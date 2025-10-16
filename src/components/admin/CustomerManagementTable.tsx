import { DataTable } from "@/components/ui/data-table";
import { getStatusBadgeVariant } from "@/lib/adminConfig";
import { Customer } from "@/hooks/useAdminData";

interface CustomerManagementTableProps {
  customers: Customer[];
  isLoading: boolean;
}

export function CustomerManagementTable({ customers, isLoading }: CustomerManagementTableProps) {
  return (
    <DataTable
      title="Customer Management"
      description="View and manage all customer accounts"
      data={customers}
      isLoading={isLoading}
      emptyMessage="No customers yet. They will appear here once they sign up."
      columns={[
        {
          header: "Company",
          accessor: "company_name",
          className: "font-medium"
        },
        {
          header: "Contact",
          accessor: "contact_name"
        },
        {
          header: "Email",
          accessor: "email"
        },
        {
          header: "Phone",
          accessor: (row) => row.phone || "—"
        },
        {
          header: "Status",
          accessor: "status",
          badge: {
            variant: (value, row) => getStatusBadgeVariant(row.status),
            format: (value) => value
          }
        },
        {
          header: "Plan",
          accessor: "plan_type",
          badge: {
            variant: () => "outline"
          }
        },
        {
          header: "Joined",
          accessor: (row) => new Date(row.created_at).toLocaleDateString()
        }
      ]}
    />
  );
}
