import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "./useAuth";

export interface ExecutiveStats {
  customers: number;
  complianceScore: number;
  workflowEfficiency: number;
  mlInsights: number;
  anomalies: number;
}

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
      const [customers, insights, anomalies] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("ml_insights").select("*", { count: "exact", head: true }),
        supabase.from("anomaly_detections").select("*", { count: "exact", head: true })
      ]);

      setStats({
        customers: customers.count || 0,
        complianceScore: 92,
        workflowEfficiency: 87,
        mlInsights: insights.count || 0,
        anomalies: anomalies.count || 0
      });
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
