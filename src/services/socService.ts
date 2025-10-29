/**
 * SOC Service
 * Centralized data operations for Security Operations Center
 */

import { supabase } from "@/integrations/supabase/client";

export interface MCPServer {
  id: string;
  server_name: string;
  server_type: string;
}

export interface ThreatAnalysis {
  analysis: string;
  securityContext: any;
  timestamp: string;
}

export interface ThreatAnalysisRequest {
  analysisType: string;
  timeframe: string;
}

export class SOCService {
  /**
   * Get active MCP servers for security
   */
  static async getSecurityMCPServers() {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "security")
      .eq("status", "active")
      .order("server_name");
    
    if (error) throw error;
    return (data || []) as MCPServer[];
  }

  /**
   * Run AI threat analysis
   */
  static async runThreatAnalysis(request: ThreatAnalysisRequest): Promise<ThreatAnalysis> {
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Authentication required to run threat analysis");
    }

    const { data, error } = await supabase.functions.invoke('soc-threat-analysis', {
      body: { 
        analysisType: request.analysisType, 
        timeframe: request.timeframe 
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data as ThreatAnalysis;
  }

  /**
   * Get user profile for SOC access
   */
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Check if user has SOC access
   */
  static async checkSOCAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { hasAccess: false, profile: null };
    }

    const profile = await this.getUserProfile(session.user.id);
    
    return {
      hasAccess: true,
      profile
    };
  }
}
