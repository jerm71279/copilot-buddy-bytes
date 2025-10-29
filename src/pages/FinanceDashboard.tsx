import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useRevioData } from "@/hooks/useRevioData";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { FinanceMetricCards } from "@/components/finance/FinanceMetricCards";
import { AdditionalMetricsCards } from "@/components/finance/AdditionalMetricsCards";
import { RecentCustomersTable } from "@/components/finance/RecentCustomersTable";
import { RevioInvoicesTable } from "@/components/finance/RevioInvoicesTable";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const FinanceDashboard = () => {
  const { isLoading, customers, stats } = useFinanceData();
  const { data: revioData, loading: revioLoading } = useRevioData();

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center py-12">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
        <DashboardSettingsMenu dashboardName="Finance" />
      </div>
      
      <FinanceMetricCards stats={stats} />

      <AdditionalMetricsCards stats={stats} />

      <RecentCustomersTable customers={customers} />

      <RevioInvoicesTable revioData={revioData} revioLoading={revioLoading} />

      <DepartmentAIAssistant 
        department="finance" 
        departmentLabel="Finance" 
      />
    </DashboardLayout>
  );
};

export default FinanceDashboard;
