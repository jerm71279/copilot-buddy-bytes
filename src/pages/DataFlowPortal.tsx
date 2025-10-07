import { useState } from "react";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Network, Database, GitBranch, Shield, Users, DollarSign, Briefcase, TrendingUp, Activity, Lock, Zap, UserPlus, Server } from "lucide-react";
import cippDiagram from "@/assets/dataflow-cipp.png";
import cmdbDiagram from "@/assets/dataflow-cmdb.png";
import changeDiagram from "@/assets/dataflow-change.png";
import complianceDiagram from "@/assets/dataflow-compliance.png";
import workflowDiagram from "@/assets/dataflow-workflow.png";

const FlowStep = ({ color, title, description }: { color: string; title: string; description: string }) => (
  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border">
    <div className={`h-2 w-2 rounded-full mt-2`} style={{ backgroundColor: `hsl(var(--${color}))` }} />
    <div>
      <strong className="text-foreground">{title}:</strong>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const DataFlowPortal = () => {
  const [selectedDashboard, setSelectedDashboard] = useState("cipp");

  const dashboards = [
    { id: "cipp", name: "CIPP", icon: Shield, color: "blue", diagram: cippDiagram },
    { id: "cmdb", name: "CMDB", icon: Database, color: "purple", diagram: cmdbDiagram },
    { id: "change", name: "Change Mgmt", icon: GitBranch, color: "orange", diagram: changeDiagram },
    { id: "compliance", name: "Compliance", icon: Shield, color: "green", diagram: complianceDiagram },
    { id: "admin", name: "Admin", icon: Lock, color: "red" },
    { id: "it", name: "IT", icon: Server, color: "cyan" },
    { id: "executive", name: "Executive", icon: TrendingUp, color: "indigo" },
    { id: "sales", name: "Sales", icon: DollarSign, color: "emerald" },
    { id: "hr", name: "HR", icon: Users, color: "pink" },
    { id: "finance", name: "Finance", icon: Briefcase, color: "amber" },
    { id: "operations", name: "Operations", icon: Activity, color: "violet" },
    { id: "soc", name: "SOC", icon: Lock, color: "rose" },
    { id: "workflow", name: "Workflows", icon: Zap, color: "yellow", diagram: workflowDiagram },
    { id: "mcp", name: "MCP", icon: Server, color: "teal" },
    { id: "onboarding", name: "Onboarding", icon: UserPlus, color: "lime" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-28 pb-8">
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
                  <CardContent className="space-y-6">
                    <div className="bg-background/80 p-4 rounded-lg border border-blue-500/20">
                      <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Visual Flow Diagram</h3>
                      <img src={cippDiagram} alt="CIPP Dashboard Data Flow" className="w-full rounded-lg" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Flow Steps</h3>
                      <FlowStep color="blue" title="Authentication" description="User authentication check → Redirect to login if needed → Load user profile and customer ID" />
                      <FlowStep color="blue" title="Data Loading" description="Query cipp_tenants & cipp_tenant_health tables → Display tenant list with health metrics" />
                      <FlowStep color="blue" title="Sync Action" description="Call cipp-sync edge function → Update database → Reload dashboard data" />
                      <FlowStep color="blue" title="Navigation" description="Select tenant to view detailed information and health status" />
                    </div>
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
                  <CardContent className="space-y-6">
                    <div className="bg-background/80 p-4 rounded-lg border border-purple-500/20">
                      <h3 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">Visual Flow Diagram</h3>
                      <img src={cmdbDiagram} alt="CMDB Dashboard Data Flow" className="w-full rounded-lg" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">Flow Steps</h3>
                      <FlowStep color="purple" title="Authentication" description="Verify user session → Load customer context" />
                      <FlowStep color="purple" title="Data Query" description="Query configuration_items table → Apply filters and search criteria → Display asset inventory" />
                      <FlowStep color="purple" title="CRUD Operations" description="Add/Edit/Delete assets → Update configuration_items table → Refresh asset list" />
                      <FlowStep color="purple" title="NinjaOne Sync" description="Call ninjaone-sync function → Fetch from NinjaOne API → Update CMDB" />
                    </div>
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
                  <CardContent className="space-y-6">
                    <div className="bg-background/80 p-4 rounded-lg border border-orange-500/20">
                      <h3 className="text-lg font-semibold mb-3 text-orange-600 dark:text-orange-400">Visual Flow Diagram</h3>
                      <img src={changeDiagram} alt="Change Management Data Flow" className="w-full rounded-lg" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Flow Steps</h3>
                      <FlowStep color="orange" title="Load Changes" description="Query change_requests table → Apply status filters → Display change list" />
                      <FlowStep color="orange" title="Create/Update" description="New change request → Update database → Log to audit_logs → Trigger notifications" />
                      <FlowStep color="orange" title="Impact Analysis" description="Call change-impact-analyzer function → Assess risk → Update change record" />
                      <FlowStep color="orange" title="Workflow" description="Status transitions → Approval routing → Stakeholder notifications" />
                    </div>
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
                  <CardContent className="space-y-6">
                    <div className="bg-background/80 p-4 rounded-lg border border-green-500/20">
                      <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">Visual Flow Diagram</h3>
                      <img src={complianceDiagram} alt="Compliance Dashboard Data Flow" className="w-full rounded-lg" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">Flow Steps</h3>
                      <FlowStep color="green" title="Load Frameworks" description="Query compliance_frameworks & compliance_controls → Calculate compliance scores" />
                      <FlowStep color="green" title="Audit Logs" description="Query audit_logs table → Display compliance activities and events" />
                      <FlowStep color="green" title="Evidence Upload" description="Upload files to storage bucket → Create compliance_evidence record → Update control status" />
                      <FlowStep color="green" title="Score Calculation" description="Recalculate compliance scores → Update dashboard metrics" />
                    </div>
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
                      <FlowStep color="cyan" title="Asset Query" description="Query configuration_items for IT assets → Query change_requests → Calculate metrics" />
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
                    <FlowStep color="violet" title="Workflow Query" description="Query workflows & workflow_executions → Calculate operational metrics" />
                    <FlowStep color="violet" title="Execution Monitoring" description="Monitor active workflows → Display execution status and history" />
                    <FlowStep color="violet" title="Performance Metrics" description="Calculate success rates, execution times, and error rates" />
                    <FlowStep color="violet" title="Alerts" description="Monitor for failures → Send notifications for critical issues" />
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
                    <FlowStep color="rose" title="Security Monitoring" description="Query audit_logs → Monitor privileged access → Track security events" />
                    <FlowStep color="rose" title="Threat Detection" description="Analyze security patterns → Detect anomalies → Generate alerts" />
                    <FlowStep color="rose" title="Incident Response" description="Create incident tickets → Track resolution → Document findings" />
                    <FlowStep color="rose" title="Compliance" description="Generate security reports → Track compliance with security frameworks" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Workflow Automation Dashboard */}
              <TabsContent value="workflow" className="mt-6">
                <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <Zap className="h-5 w-5" />
                      Workflow Automation Data Flow
                    </CardTitle>
                    <CardDescription>Automated workflow orchestration and execution</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-background/80 p-4 rounded-lg border border-yellow-500/20">
                      <h3 className="text-lg font-semibold mb-3 text-yellow-600 dark:text-yellow-400">Visual Flow Diagram</h3>
                      <img src={workflowDiagram} alt="Workflow Automation Data Flow" className="w-full rounded-lg" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">Flow Steps</h3>
                      <FlowStep color="yellow" title="Load Workflows" description="Query workflows & workflow_steps tables → Display workflow list" />
                      <FlowStep color="yellow" title="Execution" description="Trigger workflow → Call workflow-executor function → Execute steps sequentially" />
                      <FlowStep color="yellow" title="Monitoring" description="Query workflow_executions → Display execution history and status" />
                      <FlowStep color="yellow" title="Evidence Generation" description="Call workflow-evidence-generator → Create compliance evidence from workflow outputs" />
                    </div>
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
                    <FlowStep color="teal" title="Server Query" description="Query mcp_servers → Query mcp_execution_logs → Display server status" />
                    <FlowStep color="teal" title="Execution" description="Call mcp-server function → Execute AI tasks → Log execution results" />
                    <FlowStep color="teal" title="Monitoring" description="Track server health → Monitor execution metrics → Display logs" />
                    <FlowStep color="teal" title="Configuration" description="Manage server configs → Update AI models → Test connections" />
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
                    <CardDescription>New employee onboarding automation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FlowStep color="lime" title="Load Templates" description="Query onboarding_templates → Display available templates" />
                    <FlowStep color="lime" title="Create Onboarding" description="Select template → Create employee_records → Generate onboarding_tasks" />
                    <FlowStep color="lime" title="Task Management" description="Track task completion → Update progress → Send reminders" />
                    <FlowStep color="lime" title="Automation" description="Trigger workflows for provisioning → Create accounts → Assign access" />
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
