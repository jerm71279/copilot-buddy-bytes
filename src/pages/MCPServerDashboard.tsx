import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Server } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";
import DashboardNavigation from "@/components/DashboardNavigation";
import MCPServerStatus from "@/components/MCPServerStatus";
import { MCPServerConfig } from "@/components/MCPServerConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MCPServerDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userCustomerId, setUserCustomerId] = useState<string>("");

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User" });
      setUserCustomerId("demo-customer");
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*, customers(id)")
      .eq("user_id", session.user.id)
      .maybeSingle();

    setUserProfile(profile);
    setUserCustomerId(profile?.customer_id || profile?.customers?.id || "");
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate("/demo");
      return;
    }
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">MCP Server Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userProfile?.full_name}</span>
            {isPreviewMode && <Badge variant="outline">Preview Mode</Badge>}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              {isPreviewMode ? "Back to Demos" : "Sign Out"}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <DashboardNavigation 
          title="MCP Server Management"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics" },
            { name: "Compliance Portal", path: "/compliance" },
            { name: "Executive Dashboard", path: "/dashboard/executive" },
            { name: "Finance Dashboard", path: "/dashboard/finance" },
            { name: "HR Dashboard", path: "/dashboard/hr" },
            { name: "IT Dashboard", path: "/dashboard/it" },
            { name: "Operations Dashboard", path: "/dashboard/operations" },
            { name: "Sales Dashboard", path: "/dashboard/sales" },
            { name: "SOC Dashboard", path: "/dashboard/soc" },
            { name: "MCP Servers", path: "/mcp-servers" },
          ]}
        />

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Servers</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="executive">Executive</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="it">IT</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="configure">Configure New</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <MCPServerStatus customerId={userCustomerId} />
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <MCPServerStatus filterByServerType="compliance" />
          </TabsContent>

          <TabsContent value="executive" className="space-y-4">
            <MCPServerStatus filterByServerType="executive" />
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <MCPServerStatus filterByServerType="finance" />
          </TabsContent>

          <TabsContent value="hr" className="space-y-4">
            <MCPServerStatus filterByServerType="hr" />
          </TabsContent>

          <TabsContent value="it" className="space-y-4">
            <MCPServerStatus filterByServerType="it" />
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <MCPServerStatus filterByServerType="operations" />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <MCPServerStatus filterByServerType="sales" />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <MCPServerStatus filterByServerType="security" />
          </TabsContent>

          <TabsContent value="configure" className="space-y-4">
            <MCPServerConfig customerId={userCustomerId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MCPServerDashboard;