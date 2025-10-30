import { supabase } from "@/integrations/supabase/client";
import { BaseService, ServiceResponse } from "./baseService";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: string;
  source: string;
  description: string;
  user_id?: string;
  ip_address?: string;
  details?: any;
}

export interface SIEMMetrics {
  total_events: number;
  security_alerts: number;
  anomalies: number;
  events_per_hour: number;
}

/**
 * SIEM Service
 * Handles all Security Information and Event Management operations
 */
export class SIEMService extends BaseService {
  /**
   * Get security events from multiple sources
   */
  static async getSecurityEvents(
    hoursAgo: number,
    severityFilter?: string,
    eventTypeFilter?: string,
    searchQuery?: string
  ): Promise<ServiceResponse<SecurityEvent[]>> {
    return this.executeQuery(async () => {
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    // Fetch from multiple sources
    const [alerts, behavioral, audit, anomalies] = await Promise.all([
      (supabase as any).from('security_alerts').select('*').gte('created_at', since),
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
      severity: a.severity || 'medium',
      source: 'Security Alerts',
      description: a.alert_message || 'Security alert detected',
      user_id: a.user_id,
      ip_address: a.source_ip,
      details: a
    }));

    behavioral.data?.forEach((b: any) => normalized.push({
      id: b.id,
      timestamp: b.created_at,
      event_type: 'behavioral',
      severity: b.risk_score > 70 ? 'high' : b.risk_score > 40 ? 'medium' : 'low',
      source: 'Behavioral Analysis',
      description: b.event_description || 'Behavioral event detected',
      user_id: b.user_id,
      details: b
    }));

    audit.data?.forEach((a: any) => normalized.push({
      id: a.id,
      timestamp: a.created_at,
      event_type: 'audit',
      severity: 'info',
      source: 'Audit Logs',
      description: a.action || 'Audit event',
      user_id: a.user_id,
      ip_address: a.ip_address,
      details: a
    }));

    anomalies.data?.forEach((an: any) => normalized.push({
      id: an.id,
      timestamp: an.created_at,
      event_type: 'anomaly',
      severity: an.anomaly_score > 0.7 ? 'high' : 'medium',
      source: 'Anomaly Detection',
      description: an.anomaly_type || 'Anomaly detected',
      details: an
    }));

    // Sort by timestamp descending
    normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    let filtered = normalized;
    
    if (severityFilter && severityFilter !== 'all') {
      filtered = filtered.filter(e => e.severity === severityFilter);
    }
    
    if (eventTypeFilter && eventTypeFilter !== 'all') {
      filtered = filtered.filter(e => e.event_type === eventTypeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(query) ||
        e.source.toLowerCase().includes(query) ||
        e.ip_address?.toLowerCase().includes(query)
      );
    }

      return { data: filtered, error: null };
    });
  }

  /**
   * Get SIEM metrics
   */
  static async getSIEMMetrics(hoursAgo: number): Promise<ServiceResponse<SIEMMetrics>> {
    return this.executeQuery(async () => {
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const [alertCount, anomalyCount, eventCount] = await Promise.all([
      (supabase as any).from('security_alerts').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('anomaly_detections').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('behavioral_events').select('*', { count: 'exact', head: true }).gte('created_at', since),
    ]);

      const metrics = {
        total_events: (eventCount.count || 0) + (alertCount.count || 0) + (anomalyCount.count || 0),
        security_alerts: alertCount.count || 0,
        anomalies: anomalyCount.count || 0,
        events_per_hour: Math.round(((eventCount.count || 0) + (alertCount.count || 0)) / hoursAgo),
      };
      return { data: metrics, error: null };
    });
  }

  /**
   * Create a security alert
   */
  static async createSecurityAlert(input: any): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from('security_alerts')
        .insert([input])
        .select()
        .maybeSingle();
    });
  }

  /**
   * Update a security alert
   */
  static async updateSecurityAlert(id: string, updates: any): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from('security_alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Create an anomaly detection record
   */
  static async createAnomalyDetection(input: any): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('anomaly_detections')
        .insert([input])
        .select()
        .maybeSingle();
    });
  }

  /**
   * Get audit logs by user
   */
  static async getAuditLogsByUser(userId: string, limit = 100): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    });
  }

  /**
   * Get SIEM data (events + metrics)
   * Convenience method that combines getSecurityEvents and getSIEMMetrics
   */
  static async getSIEMData(timeRange: '24h' | '7d' | '30d'): Promise<ServiceResponse<{ events: SecurityEvent[]; metrics: SIEMMetrics }>> {
    return this.executeQuery(async () => {
      const hoursMap = { '24h': 24, '7d': 168, '30d': 720 };
      const hoursAgo = hoursMap[timeRange];

      const [eventsResult, metricsResult] = await Promise.all([
        this.getSecurityEvents(hoursAgo),
        this.getSIEMMetrics(hoursAgo)
      ]);

      if (eventsResult.error) throw new Error(eventsResult.error.message);
      if (metricsResult.error) throw new Error(metricsResult.error.message);

      return {
        data: {
          events: eventsResult.data || [],
          metrics: metricsResult.data || { total_events: 0, security_alerts: 0, anomalies: 0, events_per_hour: 0 }
        },
        error: null
      };
    });
  }
}
