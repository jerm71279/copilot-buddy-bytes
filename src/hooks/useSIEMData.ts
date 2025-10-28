import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "./useAuth";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: string;
  source: string;
  user_id?: string;
  description: string;
  raw_data: any;
}

export interface SIEMMetrics {
  total_events: number;
  security_alerts: number;
  anomalies: number;
  events_per_hour: number;
}

/**
 * useSIEMData Hook
 * Centralizes SIEM security event data fetching
 * ELIMINATES: Direct database queries in SIEMDashboard.tsx
 */
export function useSIEMData(timeRange: '24h' | '7d' | '30d' = '24h') {
  const { checkSessionAndLoad } = useRequireAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SIEMMetrics>({
    total_events: 0,
    security_alerts: 0,
    anomalies: 0,
    events_per_hour: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSIEMData = async () => {
    try {
      const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      // Fetch from multiple security sources
      const [alerts, behavioral, audit, anomalies] = await Promise.all([
        supabase.from('security_alerts' as any).select('*').gte('created_at', since),
        supabase.from('behavioral_events').select('*').gte('created_at', since),
        supabase.from('audit_logs').select('*').gte('created_at', since),
        supabase.from('anomaly_detections').select('*').gte('created_at', since),
      ]);

      // Normalize events from different sources
      const normalized: SecurityEvent[] = [];

      alerts.data?.forEach((a: any) => normalized.push({
        id: a.id,
        timestamp: a.created_at,
        event_type: 'security_alert',
        severity: a.severity,
        source: 'Security Alerts',
        description: a.alert_name,
        raw_data: a,
      }));

      behavioral.data?.forEach(b => normalized.push({
        id: b.id,
        timestamp: b.timestamp,
        event_type: 'behavioral',
        severity: 'info',
        source: b.system_name,
        user_id: b.user_id,
        description: `${b.action} on ${b.system_name}`,
        raw_data: b,
      }));

      audit.data?.forEach(a => normalized.push({
        id: a.id,
        timestamp: a.timestamp,
        event_type: 'audit',
        severity: 'info',
        source: a.system_name,
        user_id: a.user_id,
        description: a.action_type,
        raw_data: a,
      }));

      anomalies.data?.forEach(a => normalized.push({
        id: a.id,
        timestamp: a.created_at,
        event_type: 'anomaly',
        severity: a.severity,
        source: a.system_name,
        user_id: a.affected_user_id,
        description: a.description,
        raw_data: a,
      }));

      // Sort by timestamp desc
      const sortedEvents = normalized.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setEvents(sortedEvents);

      // Fetch metrics
      const [alertCount, anomalyCount, eventCount] = await Promise.all([
        supabase.from('security_alerts' as any).select('*', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('anomaly_detections').select('*', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('behavioral_events').select('*', { count: 'exact', head: true }).gte('created_at', since),
      ]);

      setMetrics({
        total_events: (eventCount.count || 0) + (alertCount.count || 0) + (anomalyCount.count || 0),
        security_alerts: alertCount.count || 0,
        anomalies: anomalyCount.count || 0,
        events_per_hour: Math.round(((eventCount.count || 0) + (alertCount.count || 0)) / hoursAgo),
      });

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
