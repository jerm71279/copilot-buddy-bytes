import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Activity, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);
  const [complianceStatus, setComplianceStatus] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get customer profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*, customers(*)")
        .eq("user_id", session.user.id)
        .single();

      setCustomerData(profile);

      if (profile?.customer_id) {
        // Load compliance frameworks
        const { data: frameworks } = await supabase
          .from("customer_frameworks")
          .select("*, compliance_frameworks(*)")
          .eq("customer_id", profile.customer_id);

        setComplianceStatus(frameworks || []);

        // Load integrations
        const { data: integrationsData } = await supabase
          .from("integrations")
          .select("*")
          .eq("customer_id", profile.customer_id);

        setIntegrations(integrationsData || []);
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">
                  {customerData?.customers?.company_name || "Customer Portal"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Managed by OberaConnect
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="systems">Systems</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {complianceStatus.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Active frameworks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Connected Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {integrations.filter(i => i.status === 'active').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Systems monitored
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default">
                    {customerData?.customers?.status || "Active"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Plan: {customerData?.customers?.plan_type || "Standard"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Frameworks</CardTitle>
                <CardDescription>
                  Your organization's compliance status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {complianceStatus.length === 0 ? (
                  <p className="text-muted-foreground">No frameworks configured yet.</p>
                ) : (
                  <div className="space-y-4">
                    {complianceStatus.map((framework) => (
                      <div
                        key={framework.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-semibold">
                            {framework.compliance_frameworks?.framework_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {framework.compliance_frameworks?.framework_code}
                          </p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Systems Tab */}
          <TabsContent value="systems" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Systems</CardTitle>
                <CardDescription>
                  Systems integrated and monitored by OberaConnect
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integrations.length === 0 ? (
                  <p className="text-muted-foreground">No systems connected yet.</p>
                ) : (
                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-semibold">{integration.system_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Type: {integration.system_type}
                          </p>
                        </div>
                        <Badge
                          variant={integration.status === 'active' ? 'default' : 'secondary'}
                        >
                          {integration.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>
                  Compliance and system reports generated by OberaConnect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No reports available at this time. Reports are generated monthly
                  and will appear here when ready.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerPortal;
