/**
 * MCP Server Service
 * Handles MCP (Model Context Protocol) server operations
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export interface MCPServer {
  id: string;
  customer_id: string;
  server_name: string;
  server_type: string;
  endpoint_url: string | null;
  config: any | null;
  capabilities: any;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export class MCPService extends BaseService {
  /**
   * Get MCP servers by customer
   */
  static async getMCPServers(customerId: string): Promise<ServiceResponse<MCPServer[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('mcp_servers')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
    });
  }

  /**
   * Create MCP server
   */
  static async createMCPServer(server: any): Promise<ServiceResponse<MCPServer>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('mcp_servers')
        .insert([server])
        .select()
        .maybeSingle();
    });
  }

  /**
   * Update MCP server
   */
  static async updateMCPServer(id: string, updates: Partial<MCPServer>): Promise<ServiceResponse<MCPServer>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('mcp_servers')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Delete MCP server
   */
  static async deleteMCPServer(id: string): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('mcp_servers')
        .delete()
        .eq('id', id);
      
      return { data: null, error };
    });
  }

  /**
   * Toggle MCP server active status
   */
  static async toggleMCPServer(id: string, status: string): Promise<ServiceResponse<MCPServer>> {
    return this.updateMCPServer(id, { status });
  }
}
