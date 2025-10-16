import { Shield, TestTube, Database, Activity, Code, FileCheck, Network, Bug } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface DevOpsTool {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: string;
}

export interface DocumentationResource {
  title: string;
  description: string;
  docKey: string;
}

export const testingTools: DevOpsTool[] = [
  {
    title: "Link Validation Tool",
    description: "Comprehensive testing tool to validate all routes, buttons, and links across the entire application",
    icon: Bug,
    path: "/test/link-validation",
    color: "text-destructive"
  },
  {
    title: "Input Validation Testing",
    description: "Test input validation and sanitization for security vulnerabilities including SQL injection, XSS, and path traversal",
    icon: Shield,
    path: "/test/input-validation",
    color: "text-primary"
  },
  {
    title: "System Validation Dashboard",
    description: "Comprehensive system validation including database schema, RLS policies, edge functions, and UI components",
    icon: Database,
    path: "/test/validation",
    color: "text-[hsl(var(--success))]"
  },
  {
    title: "Comprehensive Test Dashboard",
    description: "Advanced testing with test data generation, security fuzz testing, and database flow tracing",
    icon: TestTube,
    path: "/test/comprehensive",
    color: "text-secondary"
  },
  {
    title: "Network Monitoring",
    description: "Monitor network devices, SNMP metrics, syslog events, and device health status",
    icon: Network,
    path: "/network-monitoring",
    color: "text-[hsl(var(--orange))]"
  },
  {
    title: "Workflow Evidence Testing",
    description: "Test automated evidence generation and workflow compliance tracking",
    icon: FileCheck,
    path: "/test/workflow-evidence",
    color: "text-primary/80"
  }
];

export const developmentTools: DevOpsTool[] = [
  {
    title: "Architecture Canvas",
    description: "Visual system architecture diagram with component relationships and data flows",
    icon: Code,
    path: "/architecture/canvas",
    color: "text-primary/70"
  },
  {
    title: "Data Flow Portal",
    description: "Visualize data flows across CMDB, CIPP, Compliance, Change Management, and Workflows",
    icon: Activity,
    path: "/data-flow",
    color: "text-secondary/90"
  },
  {
    title: "MCP Server Dashboard",
    description: "Manage and monitor Model Context Protocol servers and execution logs",
    icon: Activity,
    path: "/mcp-servers",
    color: "text-[hsl(var(--success))]/80"
  }
];

export const documentationResources: DocumentationResource[] = [
  {
    title: "Testing Guide (TESTING_GUIDE.md)",
    description: "Complete framework covering system validation, comprehensive testing, security measures, performance benchmarks, and CI/CD integration",
    docKey: "TESTING_GUIDE"
  },
  {
    title: "Testing Procedures (TESTING_PROCEDURES.md)",
    description: "Detailed step-by-step procedures for Phase 1-6 testing including Two-Tier Feedback Loop, Core Platform Features, Integration Testing, Security, Performance, and UAT",
    docKey: "TESTING_PROCEDURES"
  },
  {
    title: "Input Validation Guide (INPUT_VALIDATION_GUIDE.md)",
    description: "Multi-layered validation approach covering client-side, component-level, edge function, and database validation to prevent SQL injection, XSS, and other attacks",
    docKey: "INPUT_VALIDATION_GUIDE"
  },
  {
    title: "Debug Procedures (DEBUG_PROCEDURES.md)",
    description: "Systematic debugging approach for edge functions, database queries, RLS policies, and common integration issues",
    docKey: "DEBUG_PROCEDURES"
  },
  {
    title: "Security Audit Report (SECURITY_AUDIT_REPORT.md)",
    description: "Comprehensive security audit covering authentication, data protection, input validation, RLS policies, and compliance requirements",
    docKey: "SECURITY_AUDIT_REPORT"
  },
  {
    title: "Architecture Documentation (ARCHITECTURE.md)",
    description: "System architecture overview including frontend/backend structure, database schema, integrations, and data flow patterns",
    docKey: "ARCHITECTURE"
  },
  {
    title: "API Reference (API_REFERENCE.md)",
    description: "Complete API documentation for all edge functions including authentication, parameters, responses, and error handling",
    docKey: "API_REFERENCE"
  }
];
