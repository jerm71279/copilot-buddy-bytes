import {
  Settings,
  Shield,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";

// Portals are the main navigation items (non-dashboard pages) with optional children
export interface Portal {
  name: string;
  path: string;
  children?: { name: string; path: string; }[];
}

// Categories organize dashboards by theme
export interface Category {
  name: string;
  icon: any;
  dashboards: { name: string; path: string; }[];
}

export const portals: Portal[] = [
  {
    name: "Deployment Planner",
    path: "/deployment-planner",
  },
  {
    name: "DevOps Portal",
    path: "/devops",
    children: [
      { name: "Documentation", path: "/docs" },
      { name: "Link Validation", path: "/test/link-validation" },
      { name: "Input Validation", path: "/test/input-validation" },
      { name: "System Validation", path: "/test/validation" },
      { name: "Comprehensive Tests", path: "/test/comprehensive" },
      { name: "Workflow Evidence", path: "/test/workflow-evidence" },
      { name: "Network Monitoring", path: "/network-monitoring" },
      { name: "Architecture Canvas", path: "/architecture/canvas" },
      { name: "Data Flow Portal", path: "/data-flows" },
      { name: "MCP Servers", path: "/mcp-servers" },
    ],
  },
  {
    name: "Employee Portal",
    path: "/portal",
    children: [
      { name: "Departments", path: "/departments" },
      { name: "Leave Requests", path: "/leave-management" },
      { name: "Time Tracking", path: "/time-tracking" },
    ],
  },
  {
    name: "Client Portal",
    path: "/client-portal",
  },
  {
    name: "Operations Portal",
    path: "/dashboard/operations",
    children: [
      { name: "CMDB", path: "/cmdb" },
      { name: "Add CMDB Item", path: "/cmdb/add" },
      { name: "Change Management", path: "/change-management" },
      { name: "New Change", path: "/change-management/new" },
      { name: "Incidents", path: "/incidents" },
      { name: "Network Monitoring", path: "/network-monitoring" },
      { name: "SLA Management", path: "/sla-management" },
      { name: "Client Onboarding", path: "/onboarding" },
      { name: "New Client", path: "/onboarding/new" },
      { name: "Onboarding Templates", path: "/onboarding/templates" },
    ],
  },
  {
    name: "Admin Portal",
    path: "/admin",
    children: [
      { name: "Applications", path: "/admin/applications" },
      { name: "Products", path: "/admin/products" },
      { name: "MCP Servers", path: "/mcp-servers" },
      { name: "RBAC", path: "/rbac" },
      { name: "Privileged Access", path: "/audit/privileged-access" },
      { name: "Customers", path: "/customers" },
      { name: "Security Training", path: "/security-training" },
      { name: "Employee Feedback", path: "/employee-feedback" },
      { name: "Internal Operations", path: "/internal-operations" },
    ],
  },
  {
    name: "Integrations Portal",
    path: "/integrations",
    children: [
      { name: "NinjaOne", path: "/ninjaone" },
      { name: "CIPP", path: "/cipp" },
    ],
  },
  {
    name: "Compliance Portal",
    path: "/compliance",
    children: [
      { name: "Audit Reports", path: "/compliance/audit-reports" },
      { name: "Frameworks", path: "/compliance" },
      { name: "Evidence Upload", path: "/compliance/evidence/upload" },
      { name: "Remediation Rules", path: "/remediation-rules" },
    ],
  },
  {
    name: "Risk Assessment",
    path: "/risk-assessment",
  },
  {
    name: "Sales Portal",
    path: "/sales-portal",
    children: [
      { name: "Leads", path: "/leads" },
      { name: "Opportunities", path: "/opportunities" },
      { name: "Quotes", path: "/quotes" },
      { name: "Contracts", path: "/contracts" },
      { name: "Projects", path: "/projects" },
    ],
  },
  {
    name: "Finance Portal",
    path: "/budgets",
    children: [
      { name: "Invoices", path: "/invoices" },
      { name: "Expenses", path: "/expenses" },
      { name: "Purchase Orders", path: "/purchase-orders" },
      { name: "Asset Financials", path: "/asset-financials" },
      { name: "Financial Reports", path: "/financial-reports" },
      { name: "Vendors", path: "/vendors" },
      { name: "Inventory", path: "/inventory" },
      { name: "Warehouses", path: "/warehouses" },
    ],
  },
  {
    name: "Analytics Portal",
    path: "/analytics",
    children: [
      { name: "Data Flows", path: "/data-flows" },
      { name: "Predictive Insights", path: "/predictive-insights" },
      { name: "Custom Reports", path: "/reports/builder" },
    ],
  },
  {
    name: "Automation Portal",
    path: "/workflow-automation",
    children: [
      { name: "Workflow Automation", path: "/workflows" },
      { name: "Workflow Orchestration", path: "/workflow-orchestration" },
      { name: "Visual Builder", path: "/workflows/visual-builder" },
      { name: "Workflow Intelligence", path: "/workflow-intelligence" },
      { name: "Intelligent Assistant", path: "/intelligent-assistant" },
    ],
  },
  {
    name: "Knowledge Portal",
    path: "/knowledge",
    children: [
      { name: "Articles", path: "/knowledge" },
      { name: "Upload", path: "/knowledge/upload" },
    ],
  },
];

export const categories: Category[] = [
  {
    name: "IT Services",
    icon: Settings,
    dashboards: [
      { name: "Operations", path: "/dashboard/operations" },
      { name: "IT", path: "/dashboard/it" },
    ],
  },
  {
    name: "Compliance & Security",
    icon: Shield,
    dashboards: [
      { name: "Compliance", path: "/dashboard/compliance" },
      { name: "SOC", path: "/dashboard/soc" },
    ],
  },
  {
    name: "Business & Sales",
    icon: TrendingUp,
    dashboards: [
      { name: "Sales", path: "/dashboard/sales" },
    ],
  },
  {
    name: "Finance",
    icon: DollarSign,
    dashboards: [
      { name: "Finance", path: "/dashboard/finance" },
    ],
  },
  {
    name: "HR & People",
    icon: Users,
    dashboards: [
      { name: "HR", path: "/dashboard/hr" },
      { name: "Employee Onboarding", path: "/hr/employee-onboarding" },
    ],
  },
  {
    name: "Analytics & Automation",
    icon: BarChart3,
    dashboards: [
      { name: "Executive", path: "/dashboard/executive" },
    ],
  },
];

// Map portal paths to slugs for filtering
export const portalSlugMap: Record<string, string> = {
  '/portal': 'employee',
  '/client-portal': 'client',
  '/dashboard/operations': 'operations',
  '/admin': 'admin',
  '/integrations': 'integrations',
  '/compliance': 'compliance',
  '/analytics': 'analytics',
  '/data-flow': 'data_flow',
};

// Map category names to module slugs
export const categorySlugMap: Record<string, string> = {
  'IT Services': 'it_services',
  'Compliance & Security': 'compliance_security',
  'Business & Sales': 'sales_marketing',
  'Finance': 'finance',
  'HR & People': 'hr',
  'Analytics & Automation': 'executive',
};
