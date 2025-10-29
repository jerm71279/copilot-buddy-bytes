/**
 * Executive Service
 * Centralized data operations for Executive Dashboard
 */

import { supabase } from "@/integrations/supabase/client";

export interface ExecutiveStats {
  customers: number;
  complianceScore: number;
  workflowEfficiency: number;
  mlInsights: number;
  anomalies: number;
}

export class ExecutiveService {
  /**
   * Get executive dashboard statistics
   */
  static async getStats(): Promise<ExecutiveStats> {
    const [customers, insights, anomalies] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("ml_insights").select("*", { count: "exact", head: true }),
      supabase.from("anomaly_detections").select("*", { count: "exact", head: true })
    ]);

    return {
      customers: customers.count || 0,
      complianceScore: 92,
      workflowEfficiency: 87,
      mlInsights: insights.count || 0,
      anomalies: anomalies.count || 0
    };
  }

  /**
   * Get active MCP servers for executive dashboard
   */
  static async getMcpServers() {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "executive")
      .eq("status", "active")
      .order("server_name");
    
    if (error) throw error;
    return data || [];
  }
}
