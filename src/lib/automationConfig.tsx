import { GitBranch, Zap, Play, CheckCircle2, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCard {
  icon: LucideIcon;
  label: string;
  key: 'total' | 'active' | 'executions' | 'successRate';
  suffix?: string;
  colorClass?: string;
}

export const statCards: StatCard[] = [
  {
    icon: GitBranch,
    label: 'Total Workflows',
    key: 'total'
  },
  {
    icon: Zap,
    label: 'Active Workflows',
    key: 'active',
    colorClass: 'text-success'
  },
  {
    icon: Play,
    label: 'Executions',
    key: 'executions'
  },
  {
    icon: CheckCircle2,
    label: 'Success Rate',
    key: 'successRate',
    suffix: '%',
    colorClass: 'text-success'
  }
];

export const getStatusColor = (isActive: boolean) => {
  return isActive ? 'default' : 'secondary';
};

export const getExecutionStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    running: 'default',
    completed: 'default',
    failed: 'destructive'
  };
  return colors[status] || 'secondary';
};

export const getExecutionIcon = (status: string) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === 'running') return <Clock className="h-4 w-4 text-primary" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

export const getTriggerLabel = (triggeredBy: string) => {
  const labels: Record<string, string> = {
    manual: '👤 Manual execution',
    webhook: '🔗 Webhook trigger',
    schedule: '⏰ Scheduled run'
  };
  return labels[triggeredBy] || `Triggered: ${triggeredBy}`;
};

export const dashboardLinks = [
  { name: 'Admin Dashboard', path: '/admin' },
  { name: 'Employee Portal', path: '/portal' },
  { name: 'Analytics Portal', path: '/analytics' },
  { name: 'Compliance Portal', path: '/compliance' },
  { name: 'Change Management', path: '/change-management' },
  { name: 'Executive Dashboard', path: '/dashboard/executive' },
  { name: 'Finance Dashboard', path: '/dashboard/finance' },
  { name: 'HR Dashboard', path: '/dashboard/hr' },
  { name: 'IT Dashboard', path: '/dashboard/it' },
  { name: 'Operations Dashboard', path: '/dashboard/operations' },
  { name: 'Sales Dashboard', path: '/dashboard/sales' },
  { name: 'SOC Dashboard', path: '/dashboard/soc' }
];
