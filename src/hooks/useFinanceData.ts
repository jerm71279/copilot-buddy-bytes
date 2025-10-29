import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/hooks/useDemoMode';
import { toast } from 'sonner';
import { FinancialMetricsService, type FinancialMetrics } from '@/services/financeService';
import { AuthService } from '@/services/authService';

export type { FinancialMetrics };

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
    try {
      const data = await FinancialMetricsService.getFinanceMCPServers();
      setMcpServers(data);
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
    }
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: 'Demo User', department: 'finance' });
      await fetchStats();
      setIsLoading(false);
      return;
    }

    try {
      const session = await AuthService.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const profile = await AuthService.getUserProfile(session.user.id);
      setUserProfile(profile);
      await fetchStats();
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchStats = async () => {
    try {
      const allCustomers = await FinancialMetricsService.getCustomers();
      setCustomers(allCustomers.slice(0, 10));
      const metrics = FinancialMetricsService.calculateFinancialMetrics(allCustomers);
      setStats(metrics);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch financial data');
    }
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate('/demo');
      return;
    }
    await AuthService.signOut();
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
