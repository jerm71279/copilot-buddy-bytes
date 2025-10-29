import { supabase } from "@/integrations/supabase/client";

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
export class SIEMService {
  /**
   * Get security events from multiple sources
   */
  static async getSecurityEvents(
    hoursAgo: number,
    severityFilter?: string,
    eventTypeFilter?: string,
    searchQuery?: string
  ): Promise<SecurityEvent[]> {
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

    return filtered;
  }

  /**
   * Get SIEM metrics
   */
  static async getSIEMMetrics(hoursAgo: number): Promise<SIEMMetrics> {
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const [alertCount, anomalyCount, eventCount] = await Promise.all([
      (supabase as any).from('security_alerts').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('anomaly_detections').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('behavioral_events').select('*', { count: 'exact', head: true }).gte('created_at', since),
    ]);

    return {
      total_events: (eventCount.count || 0) + (alertCount.count || 0) + (anomalyCount.count || 0),
      security_alerts: alertCount.count || 0,
      anomalies: anomalyCount.count || 0,
      events_per_hour: Math.round(((eventCount.count || 0) + (alertCount.count || 0)) / hoursAgo),
    };
  }

  /**
   * Create a security alert
   */
  static async createSecurityAlert(input: any) {
    const { data, error } = await (supabase as any)
      .from('security_alerts')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a security alert
   */
  static async updateSecurityAlert(id: string, updates: any) {
    const { data, error } = await (supabase as any)
      .from('security_alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create an anomaly detection record
   */
  static async createAnomalyDetection(input: any) {
    const { data, error } = await supabase
      .from('anomaly_detections')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get audit logs by user
   */
  static async getAuditLogsByUser(userId: string, limit = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
