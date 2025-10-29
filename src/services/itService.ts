/**
 * IT Service
 * Centralized IT operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface ITStats {
  integrations: number;
  activeIntegrations: number;
  mcpServers: number;
  anomalies: number;
  systemHealth: number;
}

export class ITService {
  /**
   * Fetch IT statistics
   */
  static async getITStats(): Promise<ITStats> {
    const [integrations, mcpServers, anomalies] = await Promise.all([
      supabase.from("integrations").select("*"),
      supabase.from("mcp_servers").select("*", { count: "exact", head: true }),
      supabase.from("anomaly_detections").select("*", { count: "exact", head: true })
    ]);

    const activeIntegrations = integrations.data?.filter(i => i.status === "active").length || 0;

    return {
      integrations: integrations.data?.length || 0,
      activeIntegrations,
      mcpServers: mcpServers.count || 0,
      anomalies: anomalies.count || 0,
      systemHealth: 98.5
    };
  }

  /**
   * Fetch MCP servers for IT
   */
  static async getITMCPServers() {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "it")
      .eq("status", "active")
      .order("server_name");
    
    if (error) throw error;
    return data || [];
  }
}
