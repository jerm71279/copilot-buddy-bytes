import { 
  BarChart3, 
  Bell, 
  Target, 
  FileText,
  RefreshCw,
  Activity,
  AlertCircle
} from "lucide-react";

export const metricCards = [
  {
    title: "Total Metrics",
    icon: BarChart3,
    getValue: (data: { metrics?: any[] }) => data.metrics?.length || 0,
    description: "Tracked data points",
  },
  {
    title: "Active Alerts",
    icon: Bell,
    iconClassName: "text-destructive",
    getValue: (data: { alerts?: any[] }) => data.alerts?.length || 0,
    getDescription: (data: { criticalAlerts: number }) => `${data.criticalAlerts} critical`,
  },
  {
    title: "Benchmarks",
    icon: Target,
    getValue: (data: { benchmarks?: any[] }) => data.benchmarks?.length || 0,
    getDescription: (data: { unmetBenchmarks: number }) => `${data.unmetBenchmarks} not met`,
  },
  {
    title: "Reports",
    icon: FileText,
    getValue: (data: { reports?: any[] }) => data.reports?.length || 0,
    description: "Generated",
  },
];

export const quickActions = [
  {
    label: "Aggregate Metrics",
    icon: RefreshCw,
    action: "aggregate",
    variant: "default" as const,
  },
  {
    label: "Generate Report",
    icon: FileText,
    action: "generate",
    variant: "outline" as const,
  },
  {
    label: "Check Benchmarks",
    icon: Target,
    action: "check",
    variant: "outline" as const,
  },
];

export const metricTypeLabels: Record<string, string> = {
  change_management: "Change Management",
  cmdb: "CMDB",
  workflow: "Workflow",
};

export const getAlertSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'text-destructive';
    case 'high':
      return 'text-[hsl(var(--orange))]';
    default:
      return 'text-[hsl(var(--warning))]';
  }
};

export const getAlertBadgeVariant = (severity: string) => {
  return severity === 'critical' ? 'destructive' : 'secondary';
};

export const getBenchmarkBadgeVariant = (status: string) => {
  return status === 'met' ? 'default' : 'destructive';
};

export const getReportStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const metricIcons = {
  Activity,
  AlertCircle,
};
