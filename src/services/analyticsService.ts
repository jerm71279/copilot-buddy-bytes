/**
 * Analytics Service
 * Centralized analytics operations
 */

import { supabase } from "@/integrations/supabase/client";

export class AnalyticsService {
  /**
   * Fetch system metrics
   */
  static async getSystemMetrics(customerId: string, period: string) {
    const { data, error } = await supabase
      .from('system_metrics' as any)
      .select('*')
      .eq('customer_id', customerId)
      .eq('aggregation_period', period)
      .order('period_start', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return data;
  }

  /**
   * Fetch network alerts
   */
  static async getNetworkAlerts(customerId: string) {
    const { data, error } = await supabase
      .from('network_alerts' as any)
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data;
  }

  /**
   * Fetch performance benchmarks
   */
  static async getPerformanceBenchmarks(customerId: string) {
    const { data, error } = await supabase
      .from('performance_benchmarks' as any)
      .select('*')
      .eq('customer_id', customerId)
      .order('benchmark_category');
    
    if (error) throw error;
    return data;
  }

  /**
   * Fetch generated reports
   */
  static async getGeneratedReports(customerId: string) {
    const { data, error } = await supabase
      .from('generated_reports' as any)
      .select('*')
      .eq('customer_id', customerId)
      .order('generated_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return data;
  }

  /**
   * Aggregate metrics via edge function
   */
  static async aggregateMetrics(customerId: string, period: string) {
    const { data, error } = await supabase.functions.invoke('analytics-processor', {
      body: { action: 'aggregate_metrics', period, customerId }
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Generate report via edge function
   */
  static async generateReport(customerId: string) {
    const { data, error } = await supabase.functions.invoke('analytics-processor', {
      body: { action: 'generate_report', customerId }
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Check benchmarks via edge function
   */
  static async checkBenchmarks(customerId: string) {
    const { data, error } = await supabase.functions.invoke('analytics-processor', {
      body: { action: 'check_benchmarks', customerId }
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Acknowledge alert
   */
  static async acknowledgeAlert(alertId: string, userId: string) {
    const { error } = await supabase
      .from('real_time_alerts' as any)
      .update({
        is_acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);
    
    if (error) throw error;
  }
}
