// DevOps Portal Configuration
// This is for the DevOpsPortal page, not to be confused with developersConfig.ts

export type DevOpsTool = {
  title: string;
  description: string;
  path: string;
  color: string;
};

export type DevOpsDoc = {
  docKey: string;
  title: string;
  description: string;
};

export const testingTools: DevOpsTool[] = [
  {
    title: "Comprehensive Test Dashboard",
    description: "Generate and view test data across all portals",
    path: "/test-dashboard",
    color: "text-blue-600"
  },
  {
    title: "Validation Testing",
    description: "Run comprehensive validation tests",
    path: "/validation-testing",
    color: "text-green-600"
  },
  {
    title: "Link Validation Tool",
    description: "Validate all internal and external links",
    path: "/link-validation",
    color: "text-purple-600"
  }
];

export const developmentTools: DevOpsTool[] = [
  {
    title: "Architecture Canvas",
    description: "Interactive system architecture editor",
    path: "/architecture-canvas",
    color: "text-indigo-600"
  },
  {
    title: "Architecture Diagram",
    description: "View the complete system architecture",
    path: "/architecture-diagram",
    color: "text-cyan-600"
  },
  {
    title: "Data Flow Portal",
    description: "Visualize data flows across the system",
    path: "/data-flow",
    color: "text-teal-600"
  }
];

export const documentationResources: DevOpsDoc[] = [
  {
    docKey: "testing-guide",
    title: "Testing Guide",
    description: "Comprehensive testing procedures and methodologies"
  },
  {
    docKey: "validation-procedures",
    title: "Validation Procedures",
    description: "Step-by-step validation and quality assurance processes"
  },
  {
    docKey: "security-audit",
    title: "Security Audit Report",
    description: "Security assessment findings and remediation steps"
  }
];
