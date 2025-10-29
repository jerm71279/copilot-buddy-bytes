/**
 * MCP Server Service
 * Handles MCP (Model Context Protocol) server operations
 */

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

export class MCPService {
  /**
   * Get MCP servers by customer
   */
  static async getMCPServers(customerId: string) {
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MCPServer[];
  }

  /**
   * Create MCP server
   */
  static async createMCPServer(server: any) {
    const { data, error } = await supabase
      .from('mcp_servers')
      .insert([server])
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to create MCP server');
    return data as MCPServer;
  }

  /**
   * Update MCP server
   */
  static async updateMCPServer(id: string, updates: Partial<MCPServer>) {
    const { data, error } = await supabase
      .from('mcp_servers')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to update MCP server');
    return data as MCPServer;
  }

  /**
   * Delete MCP server
   */
  static async deleteMCPServer(id: string) {
    const { error } = await supabase
      .from('mcp_servers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Toggle MCP server active status
   */
  static async toggleMCPServer(id: string, status: string) {
    return this.updateMCPServer(id, { status });
  }
}
