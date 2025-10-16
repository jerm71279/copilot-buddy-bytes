import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useRevioData } from "@/hooks/useRevioData";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { FinanceMetricCards } from "@/components/finance/FinanceMetricCards";
import { AdditionalMetricsCards } from "@/components/finance/AdditionalMetricsCards";
import { RecentCustomersTable } from "@/components/finance/RecentCustomersTable";
import { RevioInvoicesTable } from "@/components/finance/RevioInvoicesTable";

const FinanceDashboard = () => {
  const { isLoading, customers, stats } = useFinanceData();
  const { data: revioData, loading: revioLoading } = useRevioData();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 space-y-6" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>

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
      </main>
    </div>
  );
};

export default FinanceDashboard;
