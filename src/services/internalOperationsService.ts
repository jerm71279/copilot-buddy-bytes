/**
 * Internal Operations Service
 * Centralized data operations for Internal Operations Dashboard
 */

import { supabase } from "@/integrations/supabase/client";

export class InternalOperationsService {
  /**
   * Get internal operations metrics (last 30 days)
   */
  static async getMetrics() {
    const { data, error } = await (supabase as any)
      .from("internal_operations_metrics")
      .select("*")
      .order("metric_date", { ascending: false })
      .limit(30);
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get active employee champions
   */
  static async getActiveChampions() {
    const { data, error } = await (supabase as any)
      .from("employee_champions")
      .select("*")
      .eq("is_active", true);
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get recent employee feedback (last 10)
   */
  static async getRecentFeedback() {
    const { data, error } = await (supabase as any)
      .from("employee_feedback")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get metric change percentage
   */
  static getMetricChange(current?: number, previous?: number): number {
    if (!current || !previous) return 0;
    return ((current - previous) / previous) * 100;
  }
}
