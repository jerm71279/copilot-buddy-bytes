import { Shield, FileCheck, AlertTriangle, TrendingUp } from "lucide-react";

export type StatCard = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  getValue: (stats: any) => number | string;
  className?: string;
};

export const complianceStatCards: StatCard[] = [
  {
    id: 'frameworks',
    title: 'Active Frameworks',
    icon: Shield,
    getValue: (stats) => stats.frameworks
  },
  {
    id: 'evidence',
    title: 'Evidence Files',
    icon: FileCheck,
    getValue: (stats) => stats.evidenceFiles
  },
  {
    id: 'score',
    title: 'Compliance Score',
    icon: TrendingUp,
    getValue: (stats) => `${stats.complianceScore}%`,
    className: 'text-[hsl(var(--success))]'
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: AlertTriangle,
    getValue: (stats) => stats.reports
  }
];

export function getStatusColor(status: string): "default" | "secondary" | "destructive" {
  const colors: Record<string, "default" | "secondary" | "destructive"> = {
    draft: "secondary",
    in_review: "default",
    approved: "default",
    published: "default"
  };
  return colors[status] || "secondary";
}
