import { useState, useEffect } from "react";
import { useRequireAuth } from "./useAuth";
import { SIEMService } from "@/services/siemService";

export type { SecurityEvent, SIEMMetrics } from "@/services/siemService";

/**
 * useSIEMData Hook
 * Centralizes SIEM security event data fetching
 * ELIMINATES: Direct database queries in SIEMDashboard.tsx
 */
export function useSIEMData(timeRange: '24h' | '7d' | '30d' = '24h') {
  const { checkSessionAndLoad } = useRequireAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total_events: 0,
    security_alerts: 0,
    anomalies: 0,
    events_per_hour: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSIEMData = async () => {
    try {
      const result = await SIEMService.getSIEMData(timeRange);
      setEvents(result.events);
      setMetrics(result.metrics);
    } catch (error) {
      console.error('Error fetching SIEM data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSessionAndLoad(fetchSIEMData);
  }, [timeRange]);

  return {
    events,
    metrics,
    isLoading,
    refresh: fetchSIEMData
  };
}
