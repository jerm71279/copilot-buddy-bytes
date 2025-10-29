/**
 * Portal Service
 * Centralized portal data operations
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export class PortalService extends BaseService {
  /**
   * Get customer data
   */
  static async getCustomer(customerId: string): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .maybeSingle();
    });
  }

  /**
   * Get recent knowledge articles
   */
  static async getRecentArticles(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("knowledge_articles")
        .select("*")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(5);
    });
  }

  /**
   * Get recent workflow executions
   */
  static async getRecentWorkflows(customerId: string): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("workflow_executions")
        .select("*")
        .eq("customer_id", customerId)
        .order("started_at", { ascending: false })
        .limit(5);
    });
  }
}
