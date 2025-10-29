import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/hooks/useDemoMode';
import { toast } from 'sonner';
import { AuthService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

// Using HRStats from service would require reading it first, so defining here
export interface HRStats {
  totalUsers: number;
  activeSessions: number;
  notifications: number;
  avgSessionTime: string;
}

interface SimpleMCPServer {
  id: string;
  server_name: string;
  server_type: string;
}

export const useHRData = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mcpServers, setMcpServers] = useState<SimpleMCPServer[]>([]);
  const [stats, setStats] = useState<HRStats>({
    totalUsers: 0,
    activeSessions: 0,
    notifications: 0,
    avgSessionTime: "4.2 hrs"
  });

  useEffect(() => {
    checkAccess();
    fetchMcpServers();
  }, []);

  const fetchMcpServers = async () => {
    try {
      const { data, error } = await supabase
        .from("mcp_servers")
        .select("id, server_name, server_type")
        .eq("server_type", "hr")
        .eq("status", "active")
        .order("server_name");
      
      if (error) throw error;
      if (data) setMcpServers(data);
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
      toast.error('Failed to fetch MCP servers');
    }
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "hr" });
      await fetchStats();
      setIsLoading(false);
      return;
    }

    try {
    const session = await AuthService.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const profile = await AuthService.getUserProfile(session.user.id);

      setUserProfile(profile);
      await fetchStats();
    } catch (error) {
      console.error('Error checking access:', error);
      toast.error('Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [profiles, sessions, notifications] = await Promise.all([
        supabase.from("user_profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_sessions").select("*").eq("status", "active"),
        supabase.from("notifications").select("*", { count: "exact", head: true })
      ]);

      setStats({
        totalUsers: profiles.count || 0,
        activeSessions: sessions.data?.length || 0,
        notifications: notifications.count || 0,
        avgSessionTime: "4.2 hrs"
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch HR statistics');
    }
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate("/demo");
      return;
    }
    await AuthService.signOut();
    navigate("/auth");
  };

  return {
    isLoading,
    userProfile,
    mcpServers,
    stats,
    isPreviewMode,
    handleSignOut,
    fetchStats
  };
};
