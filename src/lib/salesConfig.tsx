import { 
  Target, DollarSign, TrendingUp, Users, ArrowUpRight,
  Phone, FileText, Calendar, CheckCircle, Clock, AlertCircle, BarChart
} from 'lucide-react';
import type { SalesStats } from '@/hooks/useSalesData';

export const getSalesMetricCards = (stats: SalesStats) => [
  {
    title: 'Total Revenue',
    value: `$${(stats.totalRevenue / 1000000).toFixed(2)}M`,
    description: `+${stats.monthlyGrowth}% from last month`,
    icon: DollarSign,
    color: 'text-muted-foreground',
    path: '/workflow/revenue?metric=Total Revenue&department=sales',
    descriptionColor: 'text-primary'
  },
  {
    title: 'Active Deals',
    value: stats.activeDeals,
    description: 'In pipeline',
    icon: Target,
    color: 'text-muted-foreground',
    path: '/workflow/deals?metric=Active Deals&department=sales'
  },
  {
    title: 'Total Customers',
    value: stats.customerCount,
    description: 'Active accounts',
    icon: Users,
    color: 'text-muted-foreground',
    path: '/workflow/customers?metric=Total Customers&department=sales'
  },
  {
    title: 'Conversion Rate',
    value: `${stats.conversionRate}%`,
    description: null,
    icon: TrendingUp,
    color: 'text-muted-foreground',
    path: '/workflow/conversion?metric=Conversion Rate&department=sales',
    progress: stats.conversionRate
  }
];

export const mockDeals = [
  {
    id: 1,
    title: 'Enterprise Corp - Network Upgrade',
    contact: 'John Smith',
    lastActivity: '2 days ago',
    amount: 120000,
    closeDate: 'Dec 15',
    stage: 'Negotiation',
    badgeVariant: 'default' as const
  },
  {
    id: 2,
    title: 'Tech Solutions Inc - Security Systems',
    contact: 'Sarah Johnson',
    lastActivity: 'Today',
    amount: 95000,
    closeDate: 'Dec 20',
    stage: 'Proposal',
    badgeVariant: 'secondary' as const
  },
  {
    id: 3,
    title: 'Global Services Ltd - Phone System',
    contact: 'Mike Davis',
    lastActivity: 'Yesterday',
    amount: 78000,
    closeDate: 'Jan 10',
    stage: 'Qualification',
    badgeVariant: 'outline' as const
  }
];

export const mockActivities = [
  {
    id: 1,
    type: 'call',
    title: 'Call with Enterprise Corp',
    description: 'Discussed network requirements and pricing',
    time: 'Today at 2:30 PM',
    status: 'Completed',
    icon: Phone,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary'
  },
  {
    id: 2,
    type: 'proposal',
    title: 'Sent proposal to Tech Solutions',
    description: 'Security camera system proposal with 3 tier options',
    time: 'Today at 10:00 AM',
    status: 'Sent',
    icon: FileText,
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary'
  },
  {
    id: 3,
    type: 'demo',
    title: 'Demo scheduled with Modern Office',
    description: 'Product demo for IT package',
    time: 'Tomorrow at 3:00 PM',
    status: 'Upcoming',
    icon: Calendar,
    iconBg: 'bg-accent',
    iconColor: ''
  }
];

export const mockCustomers = [
  {
    id: 1,
    name: 'Enterprise Corp',
    industry: 'Technology',
    employees: 150
  },
  {
    id: 2,
    name: 'Retail Partners LLC',
    industry: 'Retail',
    employees: 85
  },
  {
    id: 3,
    name: 'Manufacturing Pro Inc',
    industry: 'Manufacturing',
    employees: 200
  }
];

export const salesReportCards = [
  {
    title: 'Sales Analytics',
    description: 'View detailed sales performance metrics',
    icon: BarChart,
    buttonText: 'Open Analytics',
    path: '/analytics?department=sales'
  },
  {
    title: 'Performance Reports',
    description: 'Access your sales performance reports',
    icon: FileText,
    buttonText: 'View Reports',
    path: '/workflow/performance-reports?department=sales'
  },
  {
    title: 'Pipeline Management',
    description: 'Manage your sales pipeline',
    icon: Target,
    buttonText: 'Open Pipeline',
    path: '/workflow/pipeline?department=sales'
  },
  {
    title: 'Sales Dashboard',
    description: 'View team-wide sales dashboard',
    icon: Users,
    buttonText: 'Open Dashboard',
    path: '/dashboard/sales'
  }
];
