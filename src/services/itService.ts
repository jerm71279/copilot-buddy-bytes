/**
 * IT Service
 * Centralized IT operations
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export interface ITStats {
  integrations: number;
  activeIntegrations: number;
  mcpServers: number;
  anomalies: number;
  systemHealth: number;
}

export class ITService extends BaseService {
  /**
   * Fetch IT statistics
   */
  static async getITStats(): Promise<ServiceResponse<ITStats>> {
    return this.executeQuery(async () => {
      const [integrations, mcpServers, anomalies] = await Promise.all([
        supabase.from("integrations").select("*"),
        supabase.from("mcp_servers").select("*", { count: "exact", head: true }),
        supabase.from("anomaly_detections").select("*", { count: "exact", head: true })
      ]);

      const activeIntegrations = integrations.data?.filter(i => i.status === "active").length || 0;

      const stats = {
        integrations: integrations.data?.length || 0,
        activeIntegrations,
        mcpServers: mcpServers.count || 0,
        anomalies: anomalies.count || 0,
        systemHealth: 98.5
      };

      return { data: stats, error: null };
    });
  }

  /**
   * Fetch MCP servers for IT
   */
  static async getITMCPServers(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("mcp_servers")
        .select("id, server_name, server_type")
        .eq("server_type", "it")
        .eq("status", "active")
        .order("server_name");
    });
  }
}
