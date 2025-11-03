import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Shield, AlertTriangle, CheckCircle, Activity, Database, FileText, FileWarning } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmailAccountsTable } from "@/components/security/EmailAccountsTable";
import { EmailThreatsTable } from "@/components/security/EmailThreatsTable";

export default function EmailSecurity() {
  const navigate = useNavigate();
  const { customerId } = useAuth();
  const [selectedTab, setSelectedTab] = useState("accounts");

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["email-accounts", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const { data: threats, isLoading: threatsLoading } = useQuery({
    queryKey: ["email-threats", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_threats")
        .select("*, email_accounts(*)")
        .eq("customer_id", customerId!)
        .order("detected_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const stats = {
    total: accounts?.length || 0,
    monitored: accounts?.filter(a => a.is_monitored).length || 0,
    threats: threats?.filter(t => t.status === "detected").length || 0,
    blocked: threats?.filter(t => t.status === "blocked").length || 0,
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
          <Button variant="outline" size="sm" onClick={() => navigate('/security/endpoint')}>
            <Shield className="h-4 w-4 mr-2" />
            EDR
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/security/email')}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Email Security</h1>
            <p className="text-muted-foreground">Monitor and protect email communications</p>
          </div>
          <Button onClick={() => navigate("/security/alerts")}>
            View All Alerts
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Accounts</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monitored}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.threats}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.blocked}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Email Security Management</CardTitle>
            <CardDescription>Monitor email accounts and threats</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="accounts">Email Accounts</TabsTrigger>
                <TabsTrigger value="threats">Threats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="accounts" className="space-y-4">
                <EmailAccountsTable 
                  accounts={accounts || []} 
                  isLoading={accountsLoading}
                />
              </TabsContent>
              
              <TabsContent value="threats" className="space-y-4">
                <EmailThreatsTable 
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
