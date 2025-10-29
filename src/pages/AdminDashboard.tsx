import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { useAdminData } from "@/hooks/useAdminData";
import { getQuickActionCards } from "@/lib/adminConfig";
import { AdminActiveView } from "@/components/admin/AdminActiveView";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { CustomerManagementTable } from "@/components/admin/CustomerManagementTable";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

/**
 * Admin Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[User] -->|Visits /admin| B[AdminDashboard Component]
 *     B -->|useEffect| C[checkAdminAccess]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     
 *     D -->|Check Admin Role| E[user_roles Table]
 *     E -->|Query roles| F[roles Table JOIN]
 *     F -->|Verify Admin/Super Admin| G{Has Admin?}
 *     
 *     G -->|No| H[Redirect to /]
 *     G -->|Yes| I[Get customer_id]
 *     
 *     I -->|Query| J[user_profiles Table]
 *     J -->|Set State| K[userCustomerId]
 *     
 *     C -->|Load Customers| L[fetchCustomers]
 *     L -->|Query| M[customers Table]
 *     M -->|Return Data| N[setCustomers State]
 *     
 *     N -->|Render| O[Customer Table UI]
 *     O -->|Edit Action| P[Navigate to Customer Detail]
 *     
 *     Q[MCP Server Tab] -->|Display| R[MCPServerStatus Component]
 *     R -->|Query| S[mcp_servers Table]
 *     
 *     T[AI MCP Generator] -->|Invoke| U[ai-mcp-generator Edge Function]
 *     U -->|Generate Config| V[AI Model Processing]
 *     V -->|Store| S
 *     
 *     W[Test Dashboard Tab] -->|Navigate| X[/test-dashboard]
 *     
 *     style A fill:#e1f5ff
 *     style U fill:#fff4e6
 *     style M fill:#e6f7ff
 *     style S fill:#e6f7ff
 *     style G fill:#ffe6e6
 * ```
 */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isLoading, isAdmin, customers, userCustomerId, isPreviewMode } = useAdminData();
  const [activeView, setActiveView] = useState<string | null>(null);
  
  const quickActionCards = getQuickActionCards(navigate, setActiveView);

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate("/demo");
    } else {
      navigate("/auth");
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout className="space-y-8">
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {isPreviewMode && <Badge variant="outline">Preview Mode</Badge>}
          </div>
          <DashboardSettingsMenu dashboardName="Admin" />
        </div>

        <AdminActiveView 
          activeView={activeView as any}
          userCustomerId={userCustomerId}
          onClose={() => setActiveView(null)}
          onServersCreated={() => setActiveView('mcp-status')}
        />
        
        <AdminQuickActions quickActionCards={quickActionCards} />
        
      <CustomerManagementTable customers={customers} isLoading={isLoading} />

      <DepartmentAIAssistant department="admin" departmentLabel="Administration" />
    </DashboardLayout>
  );
};

export default AdminDashboard;