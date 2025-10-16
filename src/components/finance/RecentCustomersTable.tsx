import { DataTable } from "@/components/ui/data-table";
import { getStatusBadgeVariant, getPlanBadgeVariant } from "@/lib/financeConfig";

interface RecentCustomersTableProps {
  customers: any[];
}

export const RecentCustomersTable = ({ customers }: RecentCustomersTableProps) => {
  return (
    <DataTable
      title="Recent Customers"
      description="Latest customer subscriptions"
      data={customers}
      columns={[
        {
          header: "Company",
          accessor: "company_name",
          className: "font-medium"
        },
        {
          header: "Plan",
          accessor: "plan_type",
          badge: {
            variant: (value, row) => getPlanBadgeVariant(row.plan_type)
          }
        },
        {
          header: "Status",
          accessor: "status",
          badge: {
            variant: (value, row) => getStatusBadgeVariant(row.status)
          }
        },
        {
          header: "Joined",
          accessor: (row) => new Date(row.created_at).toLocaleDateString()
        }
      ]}
    />
  );
};
