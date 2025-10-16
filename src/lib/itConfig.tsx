import { Zap, Server, Activity, AlertCircle, Shield } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface ITMetricCard {
  title: string;
  icon: LucideIcon;
  getValue: (stats: any) => number | string;
  getSubtext?: (stats: any) => string;
  getBadge?: (stats: any) => { text: string; variant?: "default" | "outline" | "secondary" | "destructive" };
  path: string;
  valueColor?: string;
}

export const itMetricCards: ITMetricCard[] = [
  {
    title: "Total Integrations",
    icon: Zap,
    getValue: (stats) => stats.integrations,
    getSubtext: (stats) => `${stats.activeIntegrations} active`,
    path: "/workflow/integrations?metric=Total Integrations&department=it"
  },
  {
    title: "MCP Servers",
    icon: Server,
    getValue: (stats) => stats.mcpServers,
    getBadge: () => ({ text: "AI-Powered", variant: "outline" }),
    path: "/workflow/mcp-servers?metric=MCP Servers&department=it"
  },
  {
    title: "System Health",
    icon: Activity,
    getValue: (stats) => `${stats.systemHealth}%`,
    getSubtext: () => "Uptime",
    valueColor: "text-[hsl(var(--success))]",
    path: "/workflow/system-health?metric=System Health&department=it"
  },
  {
    title: "Anomalies Detected",
    icon: AlertCircle,
    getValue: (stats) => stats.anomalies,
    getSubtext: () => "Requires review",
    path: "/workflow/anomalies?metric=Anomalies Detected&department=it"
  }
];

export const securityCard = {
  title: "Security Operations",
  description: "Access advanced security monitoring and threat detection",
  icon: Shield,
  buttonText: "Open Security Operations Center (SOC)",
  path: "/dashboard/soc"
};
