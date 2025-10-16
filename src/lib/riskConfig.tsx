import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Target,
  Activity,
  FileText
} from "lucide-react";

export const metricCards = [
  {
    title: "Total Identified Risks",
    icon: AlertTriangle,
    getValue: (stats: any) => stats.totalRisks,
    getDescription: (stats: any) => `${stats.criticalRisks} critical, ${stats.highRisks} high priority`,
  },
  {
    title: "Risk Treatment Progress",
    icon: Target,
    getValue: (stats: any) => 
      `${stats.totalRisks > 0 ? Math.round((stats.treatedRisks / stats.totalRisks) * 100) : 0}%`,
    getDescription: (stats: any) => `${stats.treatedRisks} of ${stats.totalRisks} risks treated`,
    getProgress: (stats: any) => stats.totalRisks > 0 ? (stats.treatedRisks / stats.totalRisks) * 100 : 0,
  },
  {
    title: "Active Controls",
    icon: CheckCircle2,
    getValue: (stats: any) => stats.activeControls,
    getDescription: (controls: any) => `${controls?.length || 0} total controls deployed`,
  },
  {
    title: "Pending Actions",
    icon: Activity,
    getValue: (stats: any) => stats.pendingTreatments,
    getDescription: () => "Treatment actions in progress",
  },
];

export function getRiskLevelColor(score: number) {
  if (score >= 15) return "destructive";
  if (score >= 10) return "default";
  if (score >= 6) return "secondary";
  return "outline";
}

export function getRiskLevelLabel(score: number) {
  if (score >= 15) return "Critical";
  if (score >= 10) return "High";
  if (score >= 6) return "Medium";
  return "Low";
}

export function getCategoryIcon(category: string) {
  switch (category) {
    case 'cybersecurity': return <Shield className="h-4 w-4" />;
    case 'operational': return <Activity className="h-4 w-4" />;
    case 'compliance': return <FileText className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
}

export function getControlBadgeVariant(status: string) {
  return status === 'implemented' || status === 'verified' ? 'default' : 'secondary';
}

export function getTreatmentBadgeVariant(status: string) {
  return status === 'completed' ? 'default' : 'secondary';
}

export function getTreatmentPriorityVariant(priority: string) {
  if (priority === 'critical') return 'destructive';
  if (priority === 'high') return 'default';
  return 'outline';
}
