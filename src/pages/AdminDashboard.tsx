import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users } from "lucide-react";
import MCPServerStatus from "@/components/MCPServerStatus";
import { MCPServerConfig } from "@/components/MCPServerConfig";
import { AIMCPGenerator } from "@/components/AIMCPGenerator";
import MCPExecutionLogs from "@/components/MCPExecutionLogs";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { AutonomousAgentMonitor } from "@/components/AutonomousAgentMonitor";
import { AIAgentConfiguration } from "@/components/AIAgentConfiguration";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { useAdminData } from "@/hooks/useAdminData";
import { getQuickActionCards, getStatusBadgeVariant } from "@/lib/adminConfig";

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
      return;
    }
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 space-y-8" style={{ paddingTop: 'calc(var(--lanes-bottom, 0px) + 2rem)' }}>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {isPreviewMode && <Badge variant="outline">Preview Mode</Badge>}
          </div>
          <DashboardSettingsMenu dashboardName="Admin" />
        </div>

        {/* Active View Content */}
        {activeView && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {activeView === 'mcp-status' && 'MCP Server Status'}
                  {activeView === 'mcp-logs' && 'Execution Logs'}
                  {activeView === 'mcp-configure' && 'Configure New Server'}
                  {activeView === 'mcp-ai' && 'AI MCP Generator'}
                  {activeView === 'ai-agents' && 'Autonomous AI Agents'}
                  {activeView === 'ai-config' && 'AI Agent Configuration'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveView(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeView === 'mcp-status' && <MCPServerStatus customerId={userCustomerId} />}
              {activeView === 'mcp-logs' && <MCPExecutionLogs customerId={userCustomerId} />}
              {activeView === 'mcp-configure' && <MCPServerConfig customerId={userCustomerId} />}
              {activeView === 'mcp-ai' && (
                <AIMCPGenerator 
                  customerId={userCustomerId}
                  department="admin"
                  onServersCreated={() => {
                    toast.success("MCP servers created successfully!");
                    setActiveView('mcp-status');
                  }}
                />
              )}
              {activeView === 'ai-agents' && <AutonomousAgentMonitor />}
              {activeView === 'ai-config' && <AIAgentConfiguration />}
            </CardContent>
          </Card>
        )}
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card 
                key={card.id}
                className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={card.onClick}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {card.title}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        
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
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.plan_type}</Badge>
                        </TableCell>
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

        <DepartmentAIAssistant department="admin" departmentLabel="Administration" />
      </main>
    </div>
  );
};

export default AdminDashboard;