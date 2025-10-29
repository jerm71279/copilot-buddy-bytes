/**
 * Operations Service
 * Centralized operations management
 */

import { supabase } from "@/integrations/supabase/client";

export interface OperationsStats {
  workflows: number;
  mlInsights: number;
  efficiency: number;
  bottlenecks: number;
}

export class OperationsService {
  /**
   * Fetch operations statistics
   */
  static async getOperationsStats(): Promise<OperationsStats> {
    const [workflows, insights] = await Promise.all([
      supabase.from("workflows").select("*", { count: "exact", head: true }),
      supabase.from("ml_insights").select("*", { count: "exact", head: true })
    ]);

    return {
      workflows: workflows.count || 0,
      mlInsights: insights.count || 0,
      efficiency: 87,
      bottlenecks: 3
    };
  }

  /**
   * Fetch MCP servers for operations
   */
  static async getOperationsMCPServers() {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "operations")
      .eq("status", "active")
      .order("server_name");
    
    if (error) throw error;
    return data || [];
  }
}
