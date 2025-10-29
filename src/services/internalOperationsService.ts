/**
 * Internal Operations Service
 * Centralized data operations for Internal Operations Dashboard
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export class InternalOperationsService extends BaseService {
  /**
   * Get internal operations metrics (last 30 days)
   */
  static async getMetrics(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from("internal_operations_metrics")
        .select("*")
        .order("metric_date", { ascending: false })
        .limit(30);
    });
  }

  /**
   * Get active employee champions
   */
  static async getActiveChampions(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from("employee_champions")
        .select("*")
        .eq("is_active", true);
    });
  }

  /**
   * Get recent employee feedback (last 10)
   */
  static async getRecentFeedback(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from("employee_feedback")
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(10);
    });
  }

  /**
   * Get metric change percentage
   */
  static getMetricChange(current?: number, previous?: number): number {
    if (!current || !previous) return 0;
    return ((current - previous) / previous) * 100;
  }
}
