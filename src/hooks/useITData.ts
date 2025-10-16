import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "./useDemoMode";
import type { MCPServer } from "./useMCPServers";

interface ITStats {
  integrations: number;
  activeIntegrations: number;
  mcpServers: number;
  anomalies: number;
  systemHealth: number;
}

interface UserProfile {
  full_name: string;
  department: string;
  customer_id?: string;
}

export function useITData() {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ITStats>({
    integrations: 0,
    activeIntegrations: 0,
    mcpServers: 0,
    anomalies: 0,
    systemHealth: 98.5
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
        .eq("server_type", "it")
        .eq("status", "active")
        .order("server_name");
      
      if (data) setMcpServers(data as MCPServer[]);
    } catch (error) {
      console.error("Error fetching MCP servers:", error);
    }
  };

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "it" });
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
      const [integrations, mcpServers, anomalies] = await Promise.all([
        supabase.from("integrations").select("*"),
        supabase.from("mcp_servers").select("*", { count: "exact", head: true }),
        supabase.from("anomaly_detections").select("*", { count: "exact", head: true })
      ]);

      const activeIntegrations = integrations.data?.filter(i => i.status === "active").length || 0;

      setStats({
        integrations: integrations.data?.length || 0,
        activeIntegrations,
        mcpServers: mcpServers.count || 0,
        anomalies: anomalies.count || 0,
        systemHealth: 98.5
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

export type { ITStats, UserProfile };
