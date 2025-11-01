
import { LayoutDashboard } from "lucide-react";
import EvidenceUpload from "@/components/EvidenceUpload";
import { LinkTray } from "@/components/LinkTray";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function ComplianceEvidenceUpload() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>

        
        <LinkTray
          items={[
            { label: "Dashboards", path: "/portal", icon: LayoutDashboard },
          ]}
          maxVisibleItems={2}
        />

        <EvidenceUpload onUploadComplete={() => navigate('/compliance')} />
    </DashboardLayout>
  );
}
