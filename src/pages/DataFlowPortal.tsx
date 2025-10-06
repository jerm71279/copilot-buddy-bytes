import { useState } from "react";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Network, Database, GitBranch, Shield, Users, DollarSign, Briefcase, TrendingUp, Activity, Lock, Zap, UserPlus, Server } from "lucide-react";

const FlowStep = ({ color, title, description }: { color: string; title: string; description: string }) => (
  <div className={`flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-${color}-500/20`}>
    <div className={`h-2 w-2 rounded-full bg-${color}-500 mt-2`} />
    <div>
      <strong className={`text-${color}-600 dark:text-${color}-400`}>{title}:</strong>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const DataFlowPortal = () => {
  const [selectedDashboard, setSelectedDashboard] = useState("cipp");

  const dashboards = [
    { id: "cipp", name: "CIPP", icon: Shield, color: "blue" },
    { id: "cmdb", name: "CMDB", icon: Database, color: "purple" },
    { id: "change", name: "Change Mgmt", icon: GitBranch, color: "orange" },
    { id: "compliance", name: "Compliance", icon: Shield, color: "green" },
    { id: "admin", name: "Admin", icon: Lock, color: "red" },
    { id: "it", name: "IT", icon: Server, color: "cyan" },
    { id: "executive", name: "Executive", icon: TrendingUp, color: "indigo" },
    { id: "sales", name: "Sales", icon: DollarSign, color: "emerald" },
    { id: "hr", name: "HR", icon: Users, color: "pink" },
    { id: "finance", name: "Finance", icon: Briefcase, color: "amber" },
    { id: "operations", name: "Operations", icon: Activity, color: "violet" },
    { id: "soc", name: "SOC", icon: Lock, color: "rose" },
    { id: "workflow", name: "Workflows", icon: Zap, color: "yellow" },
    { id: "mcp", name: "MCP", icon: Server, color: "teal" },
    { id: "onboarding", name: "Onboarding", icon: UserPlus, color: "lime" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-4 py-8">
        <DashboardNavigation />
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Network className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Data Flow Architecture
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Interactive visualization of data flows across all platform dashboards
          </p>
        </div>

        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Dashboard Data Flows</CardTitle>
                <CardDescription className="text-base">
                  Select a dashboard to view its data flow architecture
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {dashboards.length} Dashboards
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={selectedDashboard} onValueChange={setSelectedDashboard}>
              <TabsList className="grid grid-cols-3 lg:grid-cols-5 gap-2 h-auto bg-transparent">
                {dashboards.map((dashboard) => {
                  const Icon = dashboard.icon;
                  return (
                    <TabsTrigger
                      key={dashboard.id}
                      value={dashboard.id}
                      className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-3"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{dashboard.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* CIPP Dashboard */}
              <TabsContent value="cipp" className="mt-6">
                <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Shield className="h-5 w-5" />
                      CIPP Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Microsoft 365 tenant management and health monitoring</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="blue" title="Authentication" description="User authentication check → Redirect to login if needed → Load user profile and customer ID" />
                    <FlowStep color="blue" title="Data Loading" description="Query cipp_tenants & cipp_tenant_health tables → Display tenant list with health metrics" />
                    <FlowStep color="blue" title="Sync Action" description="Call cipp-sync edge function → Update database → Reload dashboard data" />
                    <FlowStep color="blue" title="Navigation" description="Select tenant to view detailed information and health status" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CMDB Dashboard */}
              <TabsContent value="cmdb" className="mt-6">
                <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <Database className="h-5 w-5" />
                      CMDB Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Configuration Management Database for asset tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="purple" title="Authentication" description="Verify user session → Load customer context" />
                    <FlowStep color="purple" title="Data Query" description="Query cmdb_items table → Apply filters and search criteria → Display asset inventory" />
                    <FlowStep color="purple" title="CRUD Operations" description="Add/Edit/Delete assets → Update cmdb_items table → Refresh asset list" />
                    <FlowStep color="purple" title="NinjaOne Sync" description="Call ninjaone-sync function → Fetch from NinjaOne API → Update CMDB" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Change Management */}
              <TabsContent value="change" className="mt-6">
                <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <GitBranch className="h-5 w-5" />
                      Change Management Data Flow
                    </CardTitle>
                    <CardDescription>Track and manage organizational changes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="orange" title="Load Changes" description="Query change_requests table → Apply status filters → Display change list" />
                    <FlowStep color="orange" title="Create/Update" description="New change request → Update database → Log to audit_logs → Trigger notifications" />
                    <FlowStep color="orange" title="Impact Analysis" description="Call change-impact-analyzer function → Assess risk → Update change record" />
                    <FlowStep color="orange" title="Workflow" description="Status transitions → Approval routing → Stakeholder notifications" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Compliance Dashboard */}
              <TabsContent value="compliance" className="mt-6">
                <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Shield className="h-5 w-5" />
                      Compliance Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Framework compliance and evidence management</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="green" title="Load Frameworks" description="Query compliance_frameworks & compliance_controls → Calculate compliance scores" />
                    <FlowStep color="green" title="Audit Logs" description="Query audit_logs table → Display compliance activities and events" />
                    <FlowStep color="green" title="Evidence Upload" description="Upload files to storage bucket → Create compliance_evidence record → Update control status" />
                    <FlowStep color="green" title="Score Calculation" description="Recalculate compliance scores → Update dashboard metrics" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin Dashboard */}
              <TabsContent value="admin" className="mt-6">
                <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <Lock className="h-5 w-5" />
                      Admin Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>System administration and monitoring</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="red" title="Admin Check" description="Verify admin role → Redirect non-admins to portal" />
                    <FlowStep color="red" title="System Stats" description="Query multiple tables → audit_logs, mcp_execution_logs, workflow_executions" />
                    <FlowStep color="red" title="User Management" description="Manage user accounts, roles, and permissions" />
                    <FlowStep color="red" title="System Config" description="Integration settings → System configuration → Log monitoring" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* IT Dashboard */}
              <TabsContent value="it" className="mt-6">
                <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                      <Server className="h-5 w-5" />
                      IT Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>IT operations and asset management</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="cyan" title="Asset Query" description="Query cmdb_items for IT assets → Query change_requests → Calculate metrics" />
                    <FlowStep color="cyan" title="NinjaOne Integration" description="Query NinjaOne via edge function → Display monitoring data" />
                    <FlowStep color="cyan" title="Ticket Creation" description="Call ninjaone-ticket function → Create ticket in NinjaOne → Log to audit_logs" />
                    <FlowStep color="cyan" title="Navigation" description="Quick access to CMDB and Change Management" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Executive Dashboard */}
              <TabsContent value="executive" className="mt-6">
                <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <TrendingUp className="h-5 w-5" />
                      Executive Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>High-level business metrics and KPIs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="indigo" title="Data Aggregation" description="Aggregate from all modules → Compliance, Finance, HR, Operations, Sales" />
                    <FlowStep color="indigo" title="KPI Calculation" description="Calculate executive KPIs → Display summary metrics" />
                    <FlowStep color="indigo" title="Drill Down" description="Navigate to specific dashboards for detailed analysis" />
                    <FlowStep color="indigo" title="Reporting" description="Generate PDF/Excel reports → Display time-series trends" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sales Dashboard */}
              <TabsContent value="sales" className="mt-6">
                <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="h-5 w-5" />
                      Sales Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Sales metrics and customer data via Revio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="emerald" title="Revio Integration" description="Query revio-data function → Fetch invoices and customer data" />
                    <FlowStep color="emerald" title="Metrics" description="Calculate sales metrics → Revenue, conversion rates, customer growth" />
                    <FlowStep color="emerald" title="Customer Management" description="View customer details → Display invoice history" />
                    <FlowStep color="emerald" title="Quote Generation" description="Create new quotes → Sync with Revio API" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* HR Dashboard */}
              <TabsContent value="hr" className="mt-6">
                <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                      <Users className="h-5 w-5" />
                      HR Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Employee management and onboarding</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="pink" title="Employee Data" description="Query employee_records → Query onboarding_tasks → Query time_off_requests" />
                    <FlowStep color="pink" title="HR Metrics" description="Calculate headcount, turnover, onboarding completion" />
                    <FlowStep color="pink" title="Employee Actions" description="Add employees → Manage onboarding → Approve time off requests" />
                    <FlowStep color="pink" title="Notifications" description="Send notifications for approvals and status changes" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Finance Dashboard */}
              <TabsContent value="finance" className="mt-6">
                <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Briefcase className="h-5 w-5" />
                      Finance Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Financial metrics and invoice management</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="amber" title="Revio Data" description="Query revio-data function → Fetch invoices and payment data" />
                    <FlowStep color="amber" title="Financial Metrics" description="Calculate revenue, outstanding payments, cash flow" />
                    <FlowStep color="amber" title="Invoice Management" description="View invoice details → Track payment status" />
                    <FlowStep color="amber" title="Reporting" description="Generate financial reports → Export to Excel/CSV" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Operations Dashboard */}
              <TabsContent value="operations" className="mt-6">
                <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                      <Activity className="h-5 w-5" />
                      Operations Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Workflow execution and operational metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="violet" title="Workflow Data" description="Query workflow_executions → Query mcp_execution_logs → Query change_requests" />
                    <FlowStep color="violet" title="Operations Metrics" description="Calculate workflow success rates, execution times, operational KPIs" />
                    <FlowStep color="violet" title="Workflow Execution" description="Execute workflows → Call workflow-executor function → Log results" />
                    <FlowStep color="violet" title="Navigation" description="View workflow details → Navigate to Change Management" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SOC Dashboard */}
              <TabsContent value="soc" className="mt-6">
                <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <Lock className="h-5 w-5" />
                      SOC Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Security Operations Center monitoring</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="rose" title="Security Data" description="Query security_incidents → Query audit_logs → Query CIPP security scores" />
                    <FlowStep color="rose" title="Security Metrics" description="Calculate security posture, incident counts, threat levels" />
                    <FlowStep color="rose" title="Incident Management" description="Create/view incidents → Track resolution → Display audit logs" />
                    <FlowStep color="rose" title="Security Scanning" description="Trigger security assessments → Monitor security posture" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Workflow Automation */}
              <TabsContent value="workflow" className="mt-6">
                <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <Zap className="h-5 w-5" />
                      Workflow Automation Data Flow
                    </CardTitle>
                    <CardDescription>Workflow creation, execution, and monitoring</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="yellow" title="Workflow List" description="Query workflows table → Query workflow_executions → Display workflow library" />
                    <FlowStep color="yellow" title="Workflow Builder" description="Create/edit workflows → Configure steps and triggers → Save configuration" />
                    <FlowStep color="yellow" title="Execution" description="Call workflow-executor function → Process steps → Log to workflow_executions and mcp_execution_logs" />
                    <FlowStep color="yellow" title="Monitoring" description="View execution history → Track success/failure → Analyze performance" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MCP Server Dashboard */}
              <TabsContent value="mcp" className="mt-6">
                <Card className="border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                      <Server className="h-5 w-5" />
                      MCP Server Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Model Context Protocol server management</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="teal" title="Server List" description="Query mcp_servers table → Query mcp_execution_logs → Display server inventory" />
                    <FlowStep color="teal" title="Configuration" description="Configure MCP servers → Update mcp_servers table → Log changes" />
                    <FlowStep color="teal" title="Testing" description="Call mcp-server function → Test endpoints → Update server status" />
                    <FlowStep color="teal" title="AI Generation" description="Call ai-mcp-generator function → Create new MCP server configurations" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onboarding Dashboard */}
              <TabsContent value="onboarding" className="mt-6">
                <Card className="border-lime-500/20 bg-gradient-to-br from-lime-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lime-600 dark:text-lime-400">
                      <UserPlus className="h-5 w-5" />
                      Onboarding Dashboard Data Flow
                    </CardTitle>
                    <CardDescription>Employee onboarding task management</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="lime" title="Task Data" description="Query onboarding_tasks → Query employee_records → Calculate completion statistics" />
                    <FlowStep color="lime" title="Task Management" description="Create tasks → Assign to employees → Send notifications" />
                    <FlowStep color="lime" title="Task Completion" description="Update task status → Log to audit_logs → Recalculate progress" />
                    <FlowStep color="lime" title="Templates" description="Access onboarding templates → Clone template tasks for new employees" />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataFlowPortal;
