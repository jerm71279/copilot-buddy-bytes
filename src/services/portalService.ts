/**
 * Portal Service
 * Centralized portal data operations
 */

import { supabase } from "@/integrations/supabase/client";

export class PortalService {
  /**
   * Get customer data
   */
  static async getCustomer(customerId: string) {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get recent knowledge articles
   */
  static async getRecentArticles() {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(5);
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get recent workflow executions
   */
  static async getRecentWorkflows(customerId: string) {
    const { data, error } = await supabase
      .from("workflow_executions")
      .select("*")
      .eq("customer_id", customerId)
      .order("started_at", { ascending: false })
      .limit(5);
    
    if (error) throw error;
    return data || [];
  }
}
