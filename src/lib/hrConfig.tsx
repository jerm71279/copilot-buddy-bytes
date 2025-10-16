import { Users, UserCheck, Clock, TrendingUp, UserPlus, ClipboardList } from 'lucide-react';
import { HRStats } from '@/hooks/useHRData';

export const getHRMetricCards = (stats: HRStats) => [
  {
    title: 'Total Employees',
    value: stats.totalUsers,
    description: 'Across all departments',
    icon: Users,
    color: 'text-muted-foreground',
    clickPath: '/workflow/employees?metric=Total Employees&department=hr'
  },
  {
    title: 'Active Sessions',
    value: stats.activeSessions,
    icon: UserCheck,
    color: 'text-muted-foreground',
    clickPath: '/workflow/sessions?metric=Active Sessions&department=hr',
    badge: { label: 'Currently Online', variant: 'outline' as const }
  },
  {
    title: 'Avg Session Time',
    value: stats.avgSessionTime,
    description: 'Per employee',
    icon: Clock,
    color: 'text-muted-foreground',
    clickPath: '/workflow/session-time?metric=Avg Session Time&department=hr'
  },
  {
    title: 'Notifications',
    value: stats.notifications,
    description: 'Total sent',
    icon: TrendingUp,
    color: 'text-muted-foreground',
    clickPath: '/workflow/notifications?metric=Notifications&department=hr'
  }
];

export const hrQuickActions = [
  {
    title: 'Employee Onboarding',
    description: 'Manage new employee onboarding processes',
    icon: UserPlus,
    path: '/hr/employee-onboarding',
    buttonLabel: 'View Dashboard'
  },
  {
    title: 'Employee Directory',
    description: 'View and manage all employees',
    icon: Users,
    path: '/employees',
    buttonLabel: 'View Directory'
  },
  {
    title: 'Leave Management',
    description: 'Manage employee leave requests',
    icon: ClipboardList,
    path: '/leave-management',
    buttonLabel: 'View Requests'
  }
];

export const departmentBreakdown = [
  { department: 'Compliance', count: 8 },
  { department: 'IT & Security', count: 12 },
  { department: 'Operations', count: 15 },
  { department: 'Finance', count: 6 }
];
