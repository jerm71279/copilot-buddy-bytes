import { useState, useEffect } from "react";
import { useRequireAuth } from "./useAuth";
import { ExecutiveService, ExecutiveStats } from "@/services/executiveService";

/**
 * useExecutiveData Hook
 * Centralizes executive dashboard data fetching
 * ELIMINATES: Direct database queries in ExecutiveDashboard.tsx
 */
export function useExecutiveData() {
  const { checkSessionAndLoad } = useRequireAuth();
  const [stats, setStats] = useState<ExecutiveStats>({
    customers: 0,
    complianceScore: 0,
    workflowEfficiency: 0,
    mlInsights: 0,
    anomalies: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await ExecutiveService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching executive stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSessionAndLoad(fetchStats);
  }, []);

  return {
    stats,
    isLoading,
    refresh: fetchStats
  };
}
