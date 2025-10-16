import { TrendingUp, Workflow, AlertTriangle, Lightbulb } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface MetricCard {
  title: string;
  icon: LucideIcon;
  getValue: (stats: any) => number;
  getSubtext?: (stats: any) => string;
  getBadge?: (stats: any) => { text: string; variant?: "default" | "outline" | "secondary" | "destructive" };
  path: string;
}

export interface WorkflowMetric {
  name: string;
  avgTime: string;
  efficiency: number;
  badge: {
    text: string;
    variant: "outline" | "destructive";
  };
  hasIssue?: boolean;
}

export const metricCards: MetricCard[] = [
  {
    title: "Workflow Efficiency",
    icon: TrendingUp,
    getValue: (stats) => stats.efficiency,
    path: "/workflow/efficiency?metric=Workflow Efficiency&department=operations"
  },
  {
    title: "Active Workflows",
    icon: Workflow,
    getValue: (stats) => stats.workflows,
    getSubtext: () => "Cross-system",
    path: "/workflow/active?metric=Active Workflows&department=operations"
  },
  {
    title: "ML Insights",
    icon: Lightbulb,
    getValue: (stats) => stats.mlInsights,
    getBadge: () => ({ text: "AI-Powered", variant: "outline" }),
    path: "/workflow/insights?metric=ML Insights&department=operations"
  },
  {
    title: "Bottlenecks",
    icon: AlertTriangle,
    getValue: (stats) => stats.bottlenecks,
    getSubtext: () => "Detected",
    path: "/workflow/bottlenecks?metric=Bottlenecks&department=operations"
  }
];

export const workflowMetrics: WorkflowMetric[] = [
  {
    name: "Employee Onboarding",
    avgTime: "2.3 days avg",
    efficiency: 92,
    badge: { text: "92% efficiency", variant: "outline" }
  },
  {
    name: "Compliance Approval",
    avgTime: "4.1 hours avg",
    efficiency: 85,
    badge: { text: "85% efficiency", variant: "outline" }
  },
  {
    name: "Access Provisioning",
    avgTime: "1.2 hours avg",
    efficiency: 65,
    badge: { text: "Issue Detected", variant: "destructive" },
    hasIssue: true
  }
];
