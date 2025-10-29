import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/hooks/useDemoMode';
import type { MCPServer } from '@/hooks/useMCPServers';
import { SalesService, type SalesStats } from '@/services/salesService';
import { AuthService } from '@/services/authService';

interface UserProfile {
  full_name: string;
  department: string;
  customer_id?: string;
}

export const useSalesData = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 1250000,
    activeDeals: 24,
    customerCount: 187,
    conversionRate: 32,
    monthlyGrowth: 18
  });
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);

  useEffect(() => {
    checkAccess();
    fetchMcpServers();
  }, []);

  const fetchMcpServers = async () => {
    try {
      const data = await SalesService.getSalesMCPServers();
      setMcpServers(data as MCPServer[]);
    } catch (error) {
      console.error("Error fetching MCP servers:", error);
    }
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: 'Demo User', department: 'sales' });
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
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setIsLoading(false);
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
    stats,
    mcpServers,
    isPreviewMode,
    handleSignOut
  };
};

export type { SalesStats, UserProfile };
