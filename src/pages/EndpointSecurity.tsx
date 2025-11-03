import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Server, AlertTriangle, Activity, Database, FileText, FileWarning, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EndpointsTable } from "@/components/security/EndpointsTable";
import { EndpointThreatsTable } from "@/components/security/EndpointThreatsTable";

export default function EndpointSecurity() {
  const navigate = useNavigate();
  const { customerId } = useAuth();
  const [selectedTab, setSelectedTab] = useState("endpoints");

  const { data: endpoints, isLoading: endpointsLoading } = useQuery({
    queryKey: ["endpoints", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("endpoints")
        .select("*")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const { data: threats, isLoading: threatsLoading } = useQuery({
    queryKey: ["endpoint-threats", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("endpoint_threats")
        .select("*, endpoints(*)")
        .eq("customer_id", customerId!)
        .order("detected_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const stats = {
    total: endpoints?.length || 0,
    active: endpoints?.filter(e => e.status === "active").length || 0,
    atRisk: endpoints?.filter(e => e.risk_score > 70).length || 0,
    threats: threats?.filter(t => t.status === "detected").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/soc')}>
            <Shield className="h-4 w-4 mr-2" />
            SOC Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/security/alerts')}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/security/incidents')}>
            <FileWarning className="h-4 w-4 mr-2" />
            Incidents
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/security/threat-intel')}>
            <Database className="h-4 w-4 mr-2" />
            Threat Intel
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/security/playbooks')}>
            <FileText className="h-4 w-4 mr-2" />
            Playbooks
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/siem')}>
            <Activity className="h-4 w-4 mr-2" />
            SIEM
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/security/endpoint')}>
            <Shield className="h-4 w-4 mr-2" />
            EDR
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/security/email')}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Endpoint Detection & Response</h1>
            <p className="text-muted-foreground">Monitor and protect your endpoints</p>
          </div>
          <Button onClick={() => navigate("/security/alerts")}>
            View All Alerts
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.atRisk}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.threats}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Management</CardTitle>
            <CardDescription>View and manage your endpoint security</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="threats">Threats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="endpoints" className="space-y-4">
                <EndpointsTable 
                  endpoints={endpoints || []} 
                  isLoading={endpointsLoading}
                />
              </TabsContent>
              
              <TabsContent value="threats" className="space-y-4">
                <EndpointThreatsTable 
                  threats={threats || []} 
                  isLoading={threatsLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
