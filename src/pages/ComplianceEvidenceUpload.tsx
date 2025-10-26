import DashboardNavigation from "@/components/DashboardNavigation";
import { LayoutDashboard } from "lucide-react";
import EvidenceUpload from "@/components/EvidenceUpload";
import { LinkTray } from "@/components/LinkTray";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/shared/PageContainer";

export default function ComplianceEvidenceUpload() {
  const navigate = useNavigate();

  return (
    <PageContainer>

        <DashboardNavigation 
          title="Evidence Upload"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics" },
            { name: "Compliance Portal", path: "/compliance" },
            { name: "Change Management", path: "/change-management" },
            { name: "Executive Dashboard", path: "/dashboard/executive" },
            { name: "Finance Dashboard", path: "/dashboard/finance" },
            { name: "HR Dashboard", path: "/dashboard/hr" },
            { name: "IT Dashboard", path: "/dashboard/it" },
            { name: "Operations Dashboard", path: "/dashboard/operations" },
            { name: "Sales Dashboard", path: "/dashboard/sales" },
            { name: "SOC Dashboard", path: "/dashboard/soc" },
          ]}
        />
        
        <LinkTray
          items={[
            { label: "Dashboards", path: "/portal", icon: LayoutDashboard },
          ]}
          maxVisibleItems={2}
        />

        <EvidenceUpload onUploadComplete={() => navigate('/compliance')} />
    </PageContainer>
  );
}
