import { 
  BookOpen, 
  Workflow, 
  Brain, 
  Zap, 
  Users, 
  Database, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Settings,
  BarChart3,
  Activity,
  Lock,
  ShieldCheck,
  Bot,
  UserCog,
  Server,
  Key
} from "lucide-react";

/**
 * Centralized configuration for Portal tools and dashboards
 * Eliminates hardcoded arrays scattered across components
 */

export interface PortalTool {
  name: string;
  icon: any;
  path: string;
  description: string;
}

export interface Dashboard {
  name: string;
  icon: any;
  path: string;
  description: string;
}

// Quick Access Tools - Primary navigation
export const quickAccessTools: PortalTool[] = [
  { 
    name: "AI Hub", 
    icon: Brain, 
    path: "/ai-hub", 
    description: "3 levels of AI: Knowledge, Workflow, Assistants" 
  },
  { 
    name: "Knowledge Base", 
    icon: BookOpen, 
    path: "/knowledge", 
    description: "SOPs, guides, and documentation" 
  },
  { 
    name: "Workflows", 
    icon: Workflow, 
    path: "/workflow/automation", 
    description: "Process automation and execution" 
  },
  { 
    name: "Integrations", 
    icon: Zap, 
    path: "/integrations", 
    description: "Connected systems and tools" 
  },
  { 
    name: "CMDB", 
    icon: Database, 
    path: "/cmdb", 
    description: "Configuration items and assets" 
  },
  { 
    name: "Incidents & Auto-Remediation", 
    icon: AlertTriangle, 
    path: "/incidents", 
    description: "Monitor and resolve incidents" 
  },
  { 
    name: "Risk Assessment", 
    icon: Shield, 
    path: "/risk-assessment", 
    description: "CISSP risk analysis and controls" 
  },
  { 
    name: "Client Portal", 
    icon: Users, 
    path: "/client-portal", 
    description: "Support tickets and services" 
  },
  { 
    name: "Custom Reports", 
    icon: FileText, 
    path: "/reports/builder", 
    description: "Build and schedule reports" 
  },
  { 
    name: "Testing Dashboard", 
    icon: Settings, 
    path: "/testing-dashboard", 
    description: "System validation and testing" 
  },
];

// Admin Tools - Only visible to Super Admins and Admins
export const adminTools: PortalTool[] = [
  { 
    name: "RBAC Portal", 
    icon: Lock, 
    path: "/rbac", 
    description: "Role-based access control and permissions" 
  },
  { 
    name: "Admin Dashboard", 
    icon: Settings, 
    path: "/admin", 
    description: "System administration and configuration" 
  },
  { 
    name: "Automation Hub", 
    icon: Zap, 
    path: "/automation", 
    description: "Configure automated workflows and tasks" 
  },
  { 
    name: "AI Administration", 
    icon: Bot, 
    path: "/ai-hub", 
    description: "Manage AI agents and patterns" 
  },
  { 
    name: "User Management", 
    icon: UserCog, 
    path: "/users", 
    description: "Manage users, roles, and permissions" 
  },
  { 
    name: "Privileged Access", 
    icon: Key, 
    path: "/audit/privileged-access", 
    description: "Audit privileged access and break-glass" 
  },
  { 
    name: "SAW Management", 
    icon: ShieldCheck, 
    path: "/saw-management", 
    description: "Secure admin workstation configuration" 
  },
  { 
    name: "MCP Servers", 
    icon: Server, 
    path: "/mcp-dashboard", 
    description: "Model context protocol server management" 
  },
];

// Analytics Dashboards - Secondary access
export const analyticsDashboards: Dashboard[] = [
  { 
    name: "Operations", 
    icon: BarChart3, 
    path: "/dashboard/operations", 
    description: "Workflow metrics and insights" 
  },
  { 
    name: "Compliance", 
    icon: Shield, 
    path: "/dashboard/compliance", 
    description: "Compliance status and reports" 
  },
  { 
    name: "IT Systems", 
    icon: Activity, 
    path: "/dashboard/it", 
    description: "System health and performance" 
  },
  { 
    name: "Executive", 
    icon: BarChart3, 
    path: "/dashboard/executive", 
    description: "High-level business metrics" 
  },
];
