import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "./useDemoMode";

interface OperationsStats {
  workflows: number;
  mlInsights: number;
  efficiency: number;
  bottlenecks: number;
}

interface MCPServer {
  id: string;
  server_name: string;
  server_type: string;
}

interface UserProfile {
  full_name: string;
  department: string;
  customer_id?: string;
}

export function useOperationsData() {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<OperationsStats>({
    workflows: 0,
    mlInsights: 0,
    efficiency: 87,
    bottlenecks: 3
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
        .eq("server_type", "operations")
        .eq("status", "active")
        .order("server_name");
      
      if (data) setMcpServers(data);
    } catch (error) {
      console.error("Error fetching MCP servers:", error);
    }
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "operations" });
      await fetchStats();
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setUserProfile(profile);
      await fetchStats();
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [workflows, insights] = await Promise.all([
        supabase.from("workflows").select("*", { count: "exact", head: true }),
        supabase.from("ml_insights").select("*", { count: "exact", head: true })
      ]);

      setStats({
        workflows: workflows.count || 0,
        mlInsights: insights.count || 0,
        efficiency: 87,
        bottlenecks: 3
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate("/demo");
      return;
    }
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return {
    isLoading,
    userProfile,
    stats,
    mcpServers,
    handleSignOut
  };
}
