import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Server } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import MCPServerStatus from "@/components/MCPServerStatus";
import { MCPServerConfig } from "@/components/MCPServerConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MCPServerHealth } from "@/components/MCPServerHealth";
import { MCPServerMarketplace } from "@/components/MCPServerMarketplace";
import { MCPAutoDiscovery } from "@/components/MCPAutoDiscovery";

/**
 * MCP Server Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[User] -->|Visits /mcp-servers| B[MCPServerDashboard Component]
 *     B -->|useEffect| C[checkAccess]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     D -->|Get Profile| E[user_profiles Table]
 *     E -->|Get customer_id| F[setUserCustomerId]
 *     
 *     G[MCPServerStatus Component] -->|Query| H[mcp_servers Table]
 *     H -->|Filter by customer_id| I[Customer MCP Servers]
 *     I -->|Display List| J[Server Cards with Status]
 *     
 *     J -->|Real-time Updates| K[Server Health Monitoring]
 *     K -->|Status: active/inactive/error| L[Badge Colors]
 *     
 *     M[MCPServerConfig Component] -->|Create Server| N[Server Configuration Form]
 *     N -->|Submit| O[Insert Server]
 *     O -->|Store| H
 *     
 *     P[AI MCP Generator Tab] -->|User Input| Q[Describe Server Purpose]
 *     Q -->|Invoke| R[ai-mcp-generator Edge Function]
 *     R -->|AI Processing| S[Generate MCP Configuration]
 *     S -->|Return Config| T[Server Setup Form]
 *     T -->|Save| H
 *     
 *     U[Edit Server] -->|Click| V[Load Configuration]
 *     V -->|Update| H
 *     
 *     W[Delete Server] -->|Confirm| X[Remove from DB]
 *     X -->|Delete| H
 *     
 *     Y[Execution Logs Tab] -->|Display| Z[MCPExecutionLogs Component]
 *     Z -->|Query| AA[mcp_execution_logs Table]
 *     AA -->|Filter by server| AB[Server Activity Logs]
 *     
 *     AC[Test Server] -->|Invoke| AD[mcp-server Edge Function]
 *     AD -->|Test Connection| AE[Server Response]
 *     
 *     style A fill:#e1f5ff
 *     style R fill:#fff4e6
 *     style AD fill:#fff4e6
 *     style H fill:#e6f7ff
 *     style AA fill:#e6f7ff
 * ```
 */

const MCPServerDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const { profile: userProfile, customerId: userCustomerId, isLoading } = useUserProfile();


  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate("/demo");
    } else {
      navigate("/auth");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout>

        <Tabs defaultValue="all" className="space-y-4">
          <div className="bg-card border-b border-border -mx-4 px-4 mb-4">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-0 bg-transparent border-0">
              <TabsTrigger value="all" className="whitespace-nowrap shrink-0">All Servers</TabsTrigger>
              <TabsTrigger value="compliance" className="whitespace-nowrap shrink-0">Compliance</TabsTrigger>
              <TabsTrigger value="executive" className="whitespace-nowrap shrink-0">Executive</TabsTrigger>
              <TabsTrigger value="finance" className="whitespace-nowrap shrink-0">Finance</TabsTrigger>
              <TabsTrigger value="hr" className="whitespace-nowrap shrink-0">HR</TabsTrigger>
              <TabsTrigger value="it" className="whitespace-nowrap shrink-0">IT</TabsTrigger>
              <TabsTrigger value="operations" className="whitespace-nowrap shrink-0">Operations</TabsTrigger>
              <TabsTrigger value="sales" className="whitespace-nowrap shrink-0">Sales</TabsTrigger>
              <TabsTrigger value="security" className="whitespace-nowrap shrink-0">Security</TabsTrigger>
              <TabsTrigger value="discovery" className="whitespace-nowrap shrink-0">Auto-Discovery</TabsTrigger>
              <TabsTrigger value="health" className="whitespace-nowrap shrink-0">Health Monitor</TabsTrigger>
              <TabsTrigger value="marketplace" className="whitespace-nowrap shrink-0">Marketplace</TabsTrigger>
              <TabsTrigger value="configure" className="whitespace-nowrap shrink-0">Configure New</TabsTrigger>
            </TabsList>
          </div>

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

          <TabsContent value="discovery" className="space-y-4">
            <MCPAutoDiscovery customerId={userCustomerId} />
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <MCPServerHealth customerId={userCustomerId} />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <MCPServerMarketplace customerId={userCustomerId} />
          </TabsContent>

          <TabsContent value="configure" className="space-y-4">
            <MCPServerConfig customerId={userCustomerId} />
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
};

export default MCPServerDashboard;