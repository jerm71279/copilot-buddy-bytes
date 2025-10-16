import { Database, Code2, FileText, Workflow, Shield, Zap, LucideIcon } from "lucide-react";

export type DocumentationItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  file: string;
  category: string;
  diagram?: boolean;
};

export type IntegrationDoc = {
  title: string;
  description: string;
  file: string;
};

export const coreDocs: DocumentationItem[] = [
  {
    title: "Architecture",
    description: "Complete system architecture and design patterns",
    icon: Database,
    file: "ARCHITECTURE.md",
    category: "Core",
    diagram: true
  },
  {
    title: "API Reference",
    description: "Full API documentation for all endpoints",
    icon: Code2,
    file: "API_REFERENCE.md",
    category: "Integration"
  },
  {
    title: "Component Library",
    description: "UI component documentation and usage",
    icon: FileText,
    file: "COMPONENT_LIBRARY.md",
    category: "Frontend"
  },
  {
    title: "Dashboard Data Flows",
    description: "Data flow diagrams for all dashboards",
    icon: Workflow,
    file: "DASHBOARD_DATA_FLOWS.md",
    category: "Architecture"
  },
  {
    title: "Testing Guide",
    description: "Testing procedures and validation",
    icon: Shield,
    file: "TESTING_GUIDE.md",
    category: "QA"
  },
  {
    title: "Platform Features",
    description: "Complete feature index and capabilities",
    icon: Zap,
    file: "PLATFORM_FEATURE_INDEX.md",
    category: "Reference"
  }
];

export const integrationDocs: IntegrationDoc[] = [
  {
    title: "CIPP Integration",
    description: "Microsoft 365 tenant management integration",
    file: "CIPP_INTEGRATION_GUIDE.md"
  },
  {
    title: "Revio Integration",
    description: "Billing and revenue data integration",
    file: "REVIO_INTEGRATION_GUIDE.md"
  },
  {
    title: "Microsoft 365",
    description: "Calendar, email, and Teams integration",
    file: "MICROSOFT365_INTEGRATION.md"
  },
  {
    title: "CMDB & Change Management",
    description: "Configuration management database guide",
    file: "CMDB_CHANGE_MANAGEMENT_GUIDE.md"
  }
];

export function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/```([\s\S]+?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
    .replace(/^\* (.+)$/gim, '<li class="ml-4">• $1</li>')
    .replace(/^\d+\. (.+)$/gim, '<li class="ml-4">$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, '<br /><br />')
    .replace(/\n/g, '<br />');
}
