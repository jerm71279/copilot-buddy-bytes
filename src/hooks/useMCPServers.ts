/**
 * Centralized MCP Server data fetching and management hook
 * Eliminates duplicate data fetching across MCP components
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MCPServer {
  id: string;
  server_name: string;
  server_type: string;
  description: string;
  status: string;
  capabilities: any;
  last_health_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface MCPTool {
  id: string;
  tool_name: string;
  description: string;
  execution_count: number;
  avg_execution_time_ms: number | null;
  server_id: string;
  is_enabled: boolean;
}

export interface MCPExecutionLog {
  id: string;
  tool_name: string;
  status: string;
  execution_time_ms: number;
  timestamp: string;
  input_data: any;
  output_data: any;
  error_message: string | null;
  server_id: string;
}

/**
 * Hook to fetch MCP servers with optional filtering
 */
export function useMCPServers(filterByServerType?: string) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchServers = async () => {
    try {
      let query = supabase
        .from("mcp_servers")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterByServerType) {
        query = query.eq("server_type", filterByServerType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error("Error fetching MCP servers:", error);
      toast({
        title: "Error",
        description: "Failed to load MCP servers",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [filterByServerType]);

  return { servers, isLoading, reload: fetchServers };
}

/**
 * Hook to fetch tools for MCP servers
 */
export function useMCPTools(serverIds: string[]) {
  const [tools, setTools] = useState<Record<string, MCPTool[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTools = async () => {
      if (serverIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const toolsPromises = serverIds.map(async (serverId) => {
          const { data } = await supabase
            .from("mcp_tools")
            .select("*")
            .eq("server_id", serverId)
            .eq("is_enabled", true);
          
          return { serverId, tools: data || [] };
        });

        const toolsResults = await Promise.all(toolsPromises);
        const toolsMap: Record<string, MCPTool[]> = {};
        toolsResults.forEach(({ serverId, tools }) => {
          toolsMap[serverId] = tools;
        });
        setTools(toolsMap);
      } catch (error) {
        console.error("Error fetching MCP tools:", error);
        toast({
          title: "Error",
          description: "Failed to load MCP tools",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [JSON.stringify(serverIds)]);

  return { tools, isLoading };
}

/**
 * Hook to fetch execution logs with realtime updates
 */
export function useMCPExecutionLogs(customerId?: string, limit: number = 50) {
  const [logs, setLogs] = useState<MCPExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from("mcp_execution_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching execution logs:", error);
      toast({
        title: "Error",
        description: "Failed to load execution logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('mcp_execution_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mcp_execution_logs',
        },
        (payload) => {
          setLogs(prev => [payload.new as MCPExecutionLog, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId]);

  return { logs, isLoading, reload: fetchLogs };
}

/**
 * Execute MCP tool with proper error handling
 */
export async function executeMCPTool(
  serverId: string,
  toolName: string,
  customerId: string,
  userId: string,
  inputData: any = {}
): Promise<{ success: boolean; data?: any; error?: string; execution_time_ms?: number }> {
  try {
    const { data, error } = await supabase.functions.invoke("mcp-server", {
      body: {
        server_id: serverId,
        tool_name: toolName,
        customer_id: customerId,
        user_id: userId,
        input_data: inputData,
      },
    });

    if (error) throw error;

    return {
      success: data.success,
      data: data.result,
      error: data.error,
      execution_time_ms: data.execution_time_ms
    };
  } catch (error) {
    console.error("Error executing MCP tool:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute tool"
    };
  }
}
