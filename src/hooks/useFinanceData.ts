import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode } from '@/hooks/useDemoMode';
import { toast } from 'sonner';

export interface FinancialMetrics {
  totalCustomers: number;
  activeSubscriptions: number;
  mrr: number;
  mrrFormatted: string;
  growth: number;
  growthFormatted: string;
  arpu: number;
  arpuFormatted: string;
  churnRate: number;
  churnRateFormatted: string;
  revenueByPlan: {
    starter: number;
    professional: number;
    enterprise: number;
  };
  calculations: {
    mrrBreakdown: string;
    growthBreakdown: string;
    arpuBreakdown: string;
    churnBreakdown: string;
  };
}

const PLAN_PRICING = {
  starter: 99,
  professional: 299,
  enterprise: 999
};

export const useFinanceData = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [stats, setStats] = useState<FinancialMetrics>({
    totalCustomers: 0,
    activeSubscriptions: 0,
    mrr: 0,
    mrrFormatted: '$0',
    growth: 0,
    growthFormatted: '0%',
    arpu: 0,
    arpuFormatted: '$0',
    churnRate: 0,
    churnRateFormatted: '0%',
    revenueByPlan: {
      starter: 0,
      professional: 0,
      enterprise: 0
    },
    calculations: {
      mrrBreakdown: '',
      growthBreakdown: '',
      arpuBreakdown: '',
      churnBreakdown: ''
    }
  });

  useEffect(() => {
    checkAccess();
    fetchMcpServers();
  }, []);

  const fetchMcpServers = async () => {
    const { data } = await supabase
      .from('mcp_servers')
      .select('id, server_name, server_type')
      .eq('server_type', 'finance')
      .eq('status', 'active')
      .order('server_name');
    
    if (data) setMcpServers(data);
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: 'Demo User', department: 'finance' });
      await fetchStats();
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    setUserProfile(profile);
    await fetchStats();
    setIsLoading(false);
  };

  const calculateFinancialMetrics = (allCustomers: any[]): FinancialMetrics => {
    const activeCustomers = allCustomers.filter(c => c.status === 'active');
    const totalCustomers = allCustomers.length;
    const activeCount = activeCustomers.length;

    // Calculate MRR by plan type
    const revenueByPlan = {
      starter: activeCustomers.filter(c => c.plan_type === 'starter').length * PLAN_PRICING.starter,
      professional: activeCustomers.filter(c => c.plan_type === 'professional').length * PLAN_PRICING.professional,
      enterprise: activeCustomers.filter(c => c.plan_type === 'enterprise').length * PLAN_PRICING.enterprise
    };

    const mrr = revenueByPlan.starter + revenueByPlan.professional + revenueByPlan.enterprise;

    // Calculate previous month MRR (simulated - in production, query historical data)
    const previousMonthMRR = mrr * 0.89; // Simulated 11% growth
    const growth = previousMonthMRR > 0 ? ((mrr - previousMonthMRR) / previousMonthMRR) * 100 : 0;

    // Calculate ARPU (Average Revenue Per User)
    const arpu = activeCount > 0 ? mrr / activeCount : 0;

    // Calculate churn rate
    const churnedCustomers = allCustomers.filter(c => c.status === 'inactive' || c.status === 'cancelled').length;
    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

    // Create detailed calculation breakdowns
    const mrrBreakdown = `
MRR Calculation:
• Starter Plan: ${activeCustomers.filter(c => c.plan_type === 'starter').length} customers × $${PLAN_PRICING.starter} = $${revenueByPlan.starter.toLocaleString()}
• Professional Plan: ${activeCustomers.filter(c => c.plan_type === 'professional').length} customers × $${PLAN_PRICING.professional} = $${revenueByPlan.professional.toLocaleString()}
• Enterprise Plan: ${activeCustomers.filter(c => c.plan_type === 'enterprise').length} customers × $${PLAN_PRICING.enterprise} = $${revenueByPlan.enterprise.toLocaleString()}
━━━━━━━━━━━━━━━━━━
Total MRR: $${mrr.toLocaleString()}
    `.trim();

    const growthBreakdown = `
Growth Rate Calculation:
• Current Month MRR: $${mrr.toLocaleString()}
• Previous Month MRR: $${previousMonthMRR.toLocaleString()}
• Change: $${(mrr - previousMonthMRR).toLocaleString()}
• Growth Rate: ((${mrr.toLocaleString()} - ${previousMonthMRR.toLocaleString()}) / ${previousMonthMRR.toLocaleString()}) × 100 = ${growth.toFixed(1)}%
    `.trim();

    const arpuBreakdown = `
ARPU Calculation:
• Total MRR: $${mrr.toLocaleString()}
• Active Customers: ${activeCount}
• ARPU: $${mrr.toLocaleString()} ÷ ${activeCount} = $${arpu.toFixed(2)}

This represents the average monthly revenue generated per active customer.
    `.trim();

    const churnBreakdown = `
Churn Rate Calculation:
• Churned Customers: ${churnedCustomers}
• Total Customers: ${totalCustomers}
• Churn Rate: (${churnedCustomers} ÷ ${totalCustomers}) × 100 = ${churnRate.toFixed(2)}%

Churn rate represents the percentage of customers who have cancelled or become inactive.
    `.trim();

    return {
      totalCustomers,
      activeSubscriptions: activeCount,
      mrr,
      mrrFormatted: `$${mrr.toLocaleString()}`,
      growth,
      growthFormatted: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      arpu,
      arpuFormatted: `$${arpu.toFixed(2)}`,
      churnRate,
      churnRateFormatted: `${churnRate.toFixed(2)}%`,
      revenueByPlan,
      calculations: {
        mrrBreakdown,
        growthBreakdown,
        arpuBreakdown,
        churnBreakdown
      }
    };
  };

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch financial data');
    } else {
      const allCustomers = data || [];
      setCustomers(allCustomers.slice(0, 10)); // Show only 10 most recent in table
      const metrics = calculateFinancialMetrics(allCustomers);
      setStats(metrics);
    }
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate('/demo');
      return;
    }
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return {
    isLoading,
    userProfile,
    customers,
    mcpServers,
    stats,
    isPreviewMode,
    handleSignOut,
    fetchStats
  };
};
