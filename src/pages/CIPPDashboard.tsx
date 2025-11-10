import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import DashboardNavigation from "@/components/DashboardNavigation";
import ExternalSystemsBar from "@/components/ExternalSystemsBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  RefreshCw,
  Shield,
  AlertCircle,
  CheckCircle,
  Cloud,
  Settings,
  Activity,
  TrendingUp,
  FileText
} from "lucide-react";

/**
 * CIPP Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[User] -->|Visits /cipp| B[CIPPDashboard Component]
 *     B -->|useEffect| C[loadData Function]
 *     C -->|Auth Check| D[supabase.auth.getUser]
 *     D -->|Get Profile| E[user_profiles Table]
 *     E -->|customer_id| F[Load Tenant Data]
 *     
 *     F -->|Query| G[cipp_tenants Table]
 *     G -->|Return Tenants| H[setTenants State]
 *     
 *     F -->|Query| I[cipp_tenant_health Table]
 *     I -->|Return Health Data| J[setHealthData State]
 *     
 *     K[Sync Button Click] -->|Invoke| L[cipp-sync Edge Function]
 *     L -->|API Call| M[CIPP API]
 *     M -->|Tenant Data| N[Store in DB]
 *     N -->|Insert| G
 *     N -->|Reload| C
 *     
 *     H -->|Render| O[Tenant Cards UI]
 *     J -->|Render| P[Health Scores UI]
 *     
 *     O -->|User Clicks| Q[Navigate to Tenant Detail]
 *     
 *     style A fill:#e1f5ff
 *     style L fill:#fff4e6
 *     style M fill:#ffe6e6
 *     style G fill:#e6f7ff
 *     style I fill:#e6f7ff
 * ```
 */

interface CIPPTenant {
  id: string;
  tenant_id: string;
  tenant_name: string;
  default_domain_name: string;
  status: string;
  last_sync_at: string;
  sync_status: string;
}

interface TenantHealth {
  id: string;
  tenant_id: string;
  health_score: number | null;
  security_score: number | null;
  compliance_score: number | null;
  alerts: any;
  recommendations: any;
  last_checked_at: string;
  created_at: string;
}

const CIPPDashboard = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<CIPPTenant[]>([]);
  const [healthData, setHealthData] = useState<TenantHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // New state for tabs
  const [securityBaselines, setSecurityBaselines] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user's customer_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to continue");
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.customer_id) {
        toast.error("Customer profile not found");
        return;
      }

      setCustomerId(profile.customer_id);

      // Load CIPP tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('cipp_tenants')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('tenant_name');

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Load health data
      if (tenantsData && tenantsData.length > 0) {
        const tenantIds = tenantsData.map(t => t.id);
        const { data: healthData, error: healthError} = await supabase
          .from('cipp_tenant_health')
          .select('*')
          .in('tenant_id', tenantIds)
          .order('last_checked_at', { ascending: false});

        if (healthError) throw healthError;
        setHealthData(healthData || []);
      }

      // Load security baselines
      const { data: baselinesData, error: baselinesError } = await supabase
        .from('cipp_security_baselines')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('created_at', { ascending: false });

      if (!baselinesError) setSecurityBaselines(baselinesData || []);

      // Load policies
      const { data: policiesData, error: policiesError } = await supabase
        .from('cipp_policies')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('created_at', { ascending: false });

      if (!policiesError) setPolicies(policiesData || []);

      // Load audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('cipp_audit_logs')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 logs

      if (!auditError) setAuditLogs(auditData || []);

    } catch (error) {
      console.error('Error loading CIPP data:', error);
      toast.error("Failed to load CIPP data");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTenants = async () => {
    if (!customerId) {
      toast.error("Customer ID not found");
      return;
    }

    try {
      setSyncing(true);
      toast.info("Syncing tenants from CIPP...");

      const { data, error } = await supabase.functions.invoke('cipp-sync', {
        body: { 
          action: 'sync_tenants',
          customerId 
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        loadData();
      } else {
        toast.error(data.error || "Failed to sync tenants");
      }
    } catch (error) {
      console.error('Error syncing tenants:', error);
      toast.error("Failed to sync tenants from CIPP");
    } finally {
      setSyncing(false);
    }
  };

  const getTenantHealth = (tenantId: string) => {
    return healthData.find(h => h.tenant_id === tenantId);
  };

  const getHealthColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const stats = {
    totalTenants: tenants.length,
    healthyTenants: healthData.filter(h => (h.health_score ?? 0) >= 80).length,
    warningTenants: healthData.filter(h => (h.health_score ?? 0) >= 60 && (h.health_score ?? 0) < 80).length,
    criticalTenants: healthData.filter(h => (h.health_score ?? 0) < 60).length,
    avgSecurityScore: healthData.length > 0 
      ? Math.round(healthData.reduce((sum, h) => sum + (h.security_score ?? 0), 0) / healthData.length)
      : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <ExternalSystemsBar />

      <div className="container mx-auto px-4 pb-8" style={{ paddingTop: 'calc(var(--lanes-height, 200px) + 1rem)' }}>
        <DashboardNavigation 
          dashboards={[
            { name: "CIPP Dashboard", path: "/cipp" },
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Change Management", path: "/change-management" },
            { name: "Onboarding Dashboard", path: "/onboarding" },
            { name: "Compliance Portal", path: "/compliance" },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">CIPP Management Portal</h1>
              <p className="text-muted-foreground">
                Centralized Microsoft 365 tenant management and security automation
              </p>
            </div>
            <Button onClick={handleSyncTenants} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Tenants
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{stats.totalTenants}</span>
                  <Cloud className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Healthy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-green-500">{stats.healthyTenants}</span>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Warning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-yellow-500">{stats.warningTenants}</span>
                  <Activity className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-red-500">{stats.criticalTenants}</span>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{stats.avgSecurityScore}</span>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="tenants" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="baselines">Security Baselines</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>Managed Tenants</CardTitle>
                <CardDescription>
                  Microsoft 365 tenants managed through CIPP
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading tenants...</div>
                ) : tenants.length === 0 ? (
                  <div className="text-center py-8">
                    <Cloud className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No tenants found. Click "Sync Tenants" to import from CIPP.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tenants.map((tenant) => {
                      const health = getTenantHealth(tenant.id);
                      return (
                        <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{tenant.tenant_name}</h3>
                                  <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                                    {tenant.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">{tenant.default_domain_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Last synced: {new Date(tenant.last_sync_at).toLocaleString()}
                                </p>
                              </div>
                              
                              {health && (
                                <div className="flex items-center gap-6">
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                                    <p className={`text-2xl font-bold ${getHealthColor(health.health_score)}`}>
                                      {health.health_score ?? 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Security Score</p>
                                    <p className={`text-2xl font-bold ${getHealthColor(health.security_score)}`}>
                                      {health.security_score ?? 'N/A'}
                                    </p>
                                  </div>
                                  <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Manage
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="baselines">
            <Card>
              <CardHeader>
                <CardTitle>Security Baselines</CardTitle>
                <CardDescription>
                  Automated security configurations and standards ({securityBaselines.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {securityBaselines.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No security baselines configured yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Baseline Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Applied To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityBaselines.map((baseline) => (
                        <TableRow key={baseline.id}>
                          <TableCell className="font-medium">{baseline.baseline_name}</TableCell>
                          <TableCell className="capitalize">{baseline.baseline_type}</TableCell>
                          <TableCell>
                            {baseline.applied_to_tenants?.length || 0} tenant(s)
                          </TableCell>
                          <TableCell>
                            <Badge variant={baseline.is_active ? "default" : "secondary"}>
                              {baseline.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(baseline.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>Policies</CardTitle>
                <CardDescription>
                  Conditional Access, Intune, and other policies ({policies.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {policies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No policies configured yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Applied To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.map((policy) => (
                        <TableRow key={policy.id}>
                          <TableCell className="font-medium">{policy.policy_name}</TableCell>
                          <TableCell className="capitalize">{policy.policy_type}</TableCell>
                          <TableCell>
                            {policy.applied_to_tenants?.length || 0} tenant(s)
                          </TableCell>
                          <TableCell>
                            <Badge variant={policy.is_enabled ? "default" : "secondary"}>
                              {policy.is_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(policy.updated_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  CIPP action history and audit trail (Last 50 entries)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.action_description}
                          </TableCell>
                          <TableCell>
                            {log.target_resource || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {log.performed_by || 'System'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.result === 'success' ? "default" : "destructive"}>
                              {log.result || 'Unknown'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CIPPDashboard;
