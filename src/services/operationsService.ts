/**
 * Operations Service
 * Centralized operations management
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export interface OperationsStats {
  workflows: number;
  mlInsights: number;
  efficiency: number;
  bottlenecks: number;
}

export class OperationsService extends BaseService {
  /**
   * Fetch operations statistics
   */
  static async getOperationsStats(): Promise<ServiceResponse<OperationsStats>> {
    return this.executeQuery(async () => {
      const [workflows, insights] = await Promise.all([
        supabase.from("workflows").select("*", { count: "exact", head: true }),
        supabase.from("ml_insights").select("*", { count: "exact", head: true })
      ]);

      const stats = {
        workflows: workflows.count || 0,
        mlInsights: insights.count || 0,
        efficiency: 87,
        bottlenecks: 3
      };

      return { data: stats, error: null };
    });
  }

  /**
   * Fetch MCP servers for operations
   */
  static async getOperationsMCPServers(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("mcp_servers")
        .select("id, server_name, server_type")
        .eq("server_type", "operations")
        .eq("status", "active")
        .order("server_name");
    });
  }
}
