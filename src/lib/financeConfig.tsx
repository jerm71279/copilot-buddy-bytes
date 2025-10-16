import { DollarSign, Users, TrendingUp, Percent, CreditCard, Receipt, FileText, Calendar } from 'lucide-react';
import { FinancialMetrics } from '@/hooks/useFinanceData';

export const getFinanceMetricCards = (stats: FinancialMetrics) => [
  {
    title: 'Monthly Recurring Revenue',
    value: stats.mrrFormatted,
    description: `${stats.growthFormatted} from last month`,
    icon: DollarSign,
    color: 'text-muted-foreground',
    descriptionColor: stats.growth >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive',
    clickPath: '/workflow/revenue?metric=Monthly Revenue&department=finance',
    tooltip: stats.calculations.mrrBreakdown
  },
  {
    title: 'Total Customers',
    value: stats.totalCustomers,
    icon: Users,
    color: 'text-muted-foreground',
    clickPath: '/workflow/customers?metric=Total Customers&department=finance',
    badges: [
      { label: `${stats.activeSubscriptions} active`, variant: 'default' as const },
      { label: `${stats.totalCustomers - stats.activeSubscriptions} inactive`, variant: 'secondary' as const }
    ]
  },
  {
    title: 'Growth Rate',
    value: stats.growthFormatted,
    description: 'Month over month',
    icon: TrendingUp,
    color: 'text-muted-foreground',
    valueColor: stats.growth >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive',
    clickPath: '/workflow/growth?metric=Growth Rate&department=finance',
    tooltip: stats.calculations.growthBreakdown
  },
  {
    title: 'ARPU',
    value: stats.arpuFormatted,
    description: 'Average revenue per user',
    icon: DollarSign,
    color: 'text-muted-foreground',
    clickPath: '/workflow/arpu?metric=ARPU&department=finance',
    tooltip: stats.calculations.arpuBreakdown
  }
];

export const getAdditionalMetrics = (stats: FinancialMetrics) => [
  {
    title: 'Churn Rate',
    value: stats.churnRateFormatted,
    description: 'Customer cancellation rate',
    icon: Percent,
    color: 'text-muted-foreground',
    tooltip: stats.calculations.churnBreakdown
  },
  {
    title: 'Revenue by Plan',
    breakdown: [
      { label: 'Starter', value: stats.revenueByPlan.starter },
      { label: 'Professional', value: stats.revenueByPlan.professional },
      { label: 'Enterprise', value: stats.revenueByPlan.enterprise }
    ]
  }
];

export const financeQuickActions = [
  {
    title: 'Customer Management',
    description: 'Manage customer accounts and subscriptions',
    icon: Users,
    path: '/admin/customers',
    iconColor: 'text-primary'
  },
  {
    title: 'Budget Tracking',
    description: 'Monitor budgets and financial allocations',
    icon: Receipt,
    path: '/finance/budgets',
    iconColor: 'text-primary'
  },
  {
    title: 'Invoices',
    description: 'Create and manage customer invoices',
    icon: FileText,
    path: '/finance/invoices',
    iconColor: 'text-primary'
  },
  {
    title: 'Financial Reports',
    description: 'Generate comprehensive financial reports',
    icon: Receipt,
    path: '/finance/reports',
    iconColor: 'text-primary'
  },
  {
    title: 'Subscriptions',
    description: 'View and manage product subscriptions',
    icon: CreditCard,
    path: '/admin/subscriptions',
    iconColor: 'text-primary'
  },
  {
    title: 'Forecast & Planning',
    description: 'Access financial forecasting and planning tools',
    icon: Calendar,
    path: '/finance/planning',
    iconColor: 'text-primary'
  }
];

export const getStatusBadgeVariant = (status: string) => {
  const statusMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    cancelled: 'destructive',
    suspended: 'outline'
  };
  return statusMap[status] || 'outline';
};

export const getPlanBadgeVariant = (plan: string) => {
  const planMap: Record<string, 'default' | 'secondary' | 'outline'> = {
    starter: 'outline',
    professional: 'secondary',
    enterprise: 'default'
  };
  return planMap[plan] || 'outline';
};
