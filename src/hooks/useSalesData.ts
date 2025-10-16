import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode } from '@/hooks/useDemoMode';
import type { MCPServer } from '@/hooks/useMCPServers';

export interface SalesStats {
  totalRevenue: number;
  activeDeals: number;
  customerCount: number;
  conversionRate: number;
  monthlyGrowth: number;
}

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
      const { data } = await supabase
        .from("mcp_servers")
        .select("id, server_name, server_type")
        .eq("server_type", "sales")
        .eq("status", "active")
        .order("server_name");
      
      if (data) setMcpServers(data as MCPServer[]);
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
    await supabase.auth.signOut();
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

export type { UserProfile };
