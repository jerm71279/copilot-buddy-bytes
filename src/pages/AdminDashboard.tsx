import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Users } from "lucide-react";
import MCPServerStatus from "@/components/MCPServerStatus";
import { MCPServerConfig } from "@/components/MCPServerConfig";
import { AIMCPGenerator } from "@/components/AIMCPGenerator";
import MCPExecutionLogs from "@/components/MCPExecutionLogs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoMode } from "@/hooks/useDemoMode";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";

type Customer = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  status: string;
  plan_type: string;
  created_at: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userCustomerId, setUserCustomerId] = useState<string>("00000000-0000-0000-0000-000000000000");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    if (isPreviewMode) {
      setIsAdmin(true);
      // In preview mode, try to get a real customer ID from the database
      const { data: customers } = await supabase
        .from("customers")
        .select("id")
        .limit(1)
        .maybeSingle();
      
      if (customers?.id) {
        setUserCustomerId(customers.id);
      } else {
        // Generate a valid UUID for preview mode if no customers exist
        setUserCustomerId("00000000-0000-0000-0000-000000000000");
      }
      fetchCustomers();
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", session.user.id);

    let hasAdmin = roles?.some((ur: any) => ur.roles?.name === 'Super Admin' || ur.roles?.name === 'Admin');

    if (!hasAdmin) {
      const { data: rpcHasAdmin } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });
      hasAdmin = !!rpcHasAdmin;
    }

    if (!hasAdmin) {
      toast.error("Access denied: Admin privileges required");
      navigate("/");
      return;
    }

    // Get user's customer_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("customer_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile?.customer_id) {
      setUserCustomerId(profile.customer_id);
    }

    setIsAdmin(true);
    fetchCustomers();
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load customers");
      console.error(error);
    } else {
      setCustomers(data || []);
    }
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      trial: "secondary",
      inactive: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    return <Badge variant="outline">{plan}</Badge>;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 space-y-8 pt-24">
        <DashboardNavigation 
          title="Admin Dashboard" 
          dashboardPath="/admin"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics-portal" },
            { name: "Compliance Dashboard", path: "/compliance" },
            { name: "Executive Dashboard", path: "/executive" },
            { name: "Finance Dashboard", path: "/finance" },
            { name: "HR Dashboard", path: "/hr" },
            { name: "IT Dashboard", path: "/it" },
            { name: "Operations Dashboard", path: "/operations" },
            { name: "Sales Dashboard", path: "/sales" },
            { name: "SOC Dashboard", path: "/soc" },
          ]}
        />
        
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          {isPreviewMode && <Badge variant="outline">Preview Mode</Badge>}
        </div>

        {/* Testing & Validation Quick Access */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/test/validation')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">System Validation</CardTitle>
                <Badge variant="secondary">Testing</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run comprehensive validation tests for database, RLS, functions, and performance
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/test/comprehensive')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Data & Security Tests</CardTitle>
                <Badge variant="secondary">Testing</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Generate test data, run fuzz tests, and trace database flows
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/applications')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Application Management</CardTitle>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage applications in the app launcher
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="status" className="space-y-4">
          <TabsList>
            <TabsTrigger value="status">MCP Servers Status</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            <TabsTrigger value="configure">Configure New Server</TabsTrigger>
            <TabsTrigger value="ai-generator">AI Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <MCPServerStatus customerId={userCustomerId} />
          </TabsContent>

          <TabsContent value="logs">
            <MCPExecutionLogs customerId={userCustomerId} />
          </TabsContent>

          <TabsContent value="configure">
            <MCPServerConfig customerId={userCustomerId} />
          </TabsContent>

          <TabsContent value="ai-generator">
            <AIMCPGenerator 
              customerId={userCustomerId}
              department="admin"
              onServersCreated={() => {
                toast.success("MCP servers created successfully!");
                // Optionally refresh the status tab
              }}
            />
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Management</CardTitle>
            <CardDescription>
              View and manage all customer accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading customers...</div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No customers yet. They will appear here once they sign up.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.company_name}
                        </TableCell>
                        <TableCell>{customer.contact_name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || "—"}</TableCell>
                        <TableCell>{getStatusBadge(customer.status)}</TableCell>
                        <TableCell>{getPlanBadge(customer.plan_type)}</TableCell>
                        <TableCell>
                          {new Date(customer.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;