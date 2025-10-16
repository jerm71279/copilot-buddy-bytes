import { 
  Shield, AlertTriangle, Activity, Eye, Lock, 
  TrendingUp, Database, Users, FileWarning, CheckCircle2,
  Clock, Zap, Globe, Server
} from "lucide-react";

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical": return "text-destructive bg-destructive/10 border-destructive/20";
    case "high": return "text-warning bg-warning/10 border-warning/20";
    case "medium": return "text-warning bg-warning/10 border-warning/20";
    case "low": return "text-secondary bg-secondary/10 border-secondary/20";
    default: return "text-muted-foreground bg-muted border-border";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "resolved": return "bg-success/10 text-success";
    case "investigating": return "bg-primary/10 text-primary";
    case "new": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

export interface MetricCardConfig {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  getValue: (metrics: any) => string | number;
  subtitle?: (metrics: any) => string;
  onClick?: (navigate: any) => void;
  className?: string;
}

export const primarySecurityMetrics: MetricCardConfig[] = [
  {
    id: 'total-incidents',
    title: 'Total Incidents',
    icon: AlertTriangle,
    getValue: (m) => m.totalIncidents,
    subtitle: (m) => `${m.criticalAlerts} critical alerts`,
    onClick: (nav) => nav('/workflow/incidents?metric=Total Incidents&department=security')
  },
  {
    id: 'active-threats',
    title: 'Active Threats',
    icon: Eye,
    getValue: (m) => m.activeThreats,
    subtitle: () => 'Requires attention',
    onClick: (nav) => nav('/workflow/threats?metric=Active Threats&department=security'),
    className: 'text-warning'
  },
  {
    id: 'compliance-score',
    title: 'Compliance Score',
    icon: CheckCircle2,
    getValue: (m) => `${m.complianceScore}%`,
    onClick: (nav) => nav('/workflow/compliance-score?metric=Compliance Score&department=security'),
    className: 'text-primary'
  },
  {
    id: 'response-time',
    title: 'Avg Response Time',
    icon: Clock,
    getValue: (m) => m.avgResponseTime,
    subtitle: () => 'Target: <15m',
    onClick: (nav) => nav('/workflow/response-time?metric=Response Time&department=security')
  }
];

export const secondarySecurityMetrics: MetricCardConfig[] = [
  {
    id: 'systems-monitored',
    title: 'Systems Monitored',
    icon: Database,
    getValue: (m) => m.systemsMonitored
  },
  {
    id: 'threats-prevented',
    title: 'Threats Prevented',
    icon: Lock,
    getValue: (m) => m.threatsPrevented,
    className: 'text-primary'
  },
  {
    id: 'resolved-today',
    title: 'Resolved Today',
    icon: TrendingUp,
    getValue: (m) => m.resolvedIncidents
  }
];

export const advancedSecurityMetrics: MetricCardConfig[] = [
  {
    id: 'failed-logins',
    title: 'Failed Logins (24h)',
    icon: AlertTriangle,
    getValue: (m) => m.failedLogins24h,
    className: 'text-warning'
  },
  {
    id: 'active-lockouts',
    title: 'Active Lockouts',
    icon: Lock,
    getValue: (m) => m.activeLockouts,
    className: 'text-destructive'
  },
  {
    id: 'lateral-movement',
    title: 'Lateral Movement (24h)',
    icon: Activity,
    getValue: (m) => m.lateralMovement24h,
    className: 'text-warning'
  },
  {
    id: 'exfiltration-attempts',
    title: 'Exfiltration Attempts',
    icon: FileWarning,
    getValue: (m) => m.exfiltrationAttempts24h,
    className: 'text-destructive'
  }
];

export const threatDetectionMetrics: MetricCardConfig[] = [
  {
    id: 'active-threats-count',
    title: 'Active Threats',
    icon: AlertTriangle,
    getValue: (m) => m.activeThreatsCount,
    className: 'text-destructive'
  },
  {
    id: 'attack-chains',
    title: 'Attack Chains',
    icon: Zap,
    getValue: (m) => m.activeAttackChains,
    className: 'text-warning'
  },
  {
    id: 'honeypot-triggers',
    title: 'Honeypot Triggers',
    icon: Shield,
    getValue: (m) => m.honeypotTriggers24h,
    className: 'text-primary'
  },
  {
    id: 'critical-deviations',
    title: 'Critical Deviations',
    icon: Activity,
    getValue: (m) => m.criticalDeviations,
    className: 'text-destructive'
  }
];
