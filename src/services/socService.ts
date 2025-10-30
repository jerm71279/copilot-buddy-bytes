/**
 * SOC Service
 * Centralized data operations for Security Operations Center
 */

import { supabase } from "@/integrations/supabase/client";
import { BaseService, ServiceResponse } from "./baseService";

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

export class SOCService extends BaseService {
  /**
   * Get active MCP servers for security
   */
  static async getSecurityMCPServers(): Promise<ServiceResponse<MCPServer[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("mcp_servers")
        .select("id, server_name, server_type")
        .eq("server_type", "security")
        .eq("status", "active")
        .order("server_name");
    });
  }

  /**
   * Run AI threat analysis
   */
  static async runThreatAnalysis(request: ThreatAnalysisRequest): Promise<ServiceResponse<ThreatAnalysis>> {
    return this.executeQuery(async () => {
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

      return { data: data as ThreatAnalysis, error: null };
    });
  }

  /**
   * Get user profile for SOC access
   */
  static async getUserProfile(userId: string): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    });
  }

  /**
   * Check if user has SOC access
   */
  static async checkSOCAccess(): Promise<{ hasAccess: boolean; profile: any | null }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { hasAccess: false, profile: null };
    }

    const profileResult = await this.getUserProfile(session.user.id);
    
    return {
      hasAccess: true,
      profile: profileResult.data
    };
  }
}
