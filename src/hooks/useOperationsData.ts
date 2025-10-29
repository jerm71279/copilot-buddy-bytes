import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "./useDemoMode";
import type { MCPServer } from "./useMCPServers";
import { OperationsService, type OperationsStats } from "@/services/operationsService";
import { AuthService } from "@/services/authService";

export type { OperationsStats };

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
      const response = await OperationsService.getOperationsMCPServers();
      if (response.data) {
        setMcpServers(response.data as MCPServer[]);
      }
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
      const session = await AuthService.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const profile = await AuthService.getUserProfile(session.user.id);
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
      const response = await OperationsService.getOperationsStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
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
    stats,
    mcpServers,
    handleSignOut
  };
}
