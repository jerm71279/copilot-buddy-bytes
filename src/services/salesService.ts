/**
 * Sales Service
 * Centralized data operations for Sales Dashboard
 */

import { supabase } from "@/integrations/supabase/client";

export interface MCPServer {
  id: string;
  server_name: string;
  server_type: string;
}

export interface SalesStats {
  totalRevenue: number;
  activeDeals: number;
  customerCount: number;
  conversionRate: number;
  monthlyGrowth: number;
}

export class SalesService {
  /**
   * Get active MCP servers for sales
   */
  static async getSalesMCPServers() {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("id, server_name, server_type")
      .eq("server_type", "sales")
      .eq("status", "active")
      .order("server_name");
    
    if (error) throw error;
    return (data || []) as MCPServer[];
  }

  /**
   * Get user profile for sales access
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
   * Check if user has sales access
   */
  static async checkSalesAccess() {
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

  /**
   * Get sales statistics
   * Note: Currently returns static data - integrate with actual data sources as needed
   */
  static async getSalesStats(): Promise<SalesStats> {
    // TODO: Replace with actual queries when data sources are available
    return {
      totalRevenue: 1250000,
      activeDeals: 24,
      customerCount: 187,
      conversionRate: 32,
      monthlyGrowth: 18
    };
  }
}

/**
 * Lead Service
 * TODO: Implement full lead management operations
 */
export class LeadService {
  static async getLeads() {
    const { data, error } = await (supabase as any)
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getLeadsByCustomer(customerId: string) {
    const { data, error } = await (supabase as any)
      .from("leads")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false});
    
    if (error) throw error;
    return data || [];
  }

  static async createLead(lead: any) {
    const { data, error } = await (supabase as any)
      .from("leads")
      .insert(lead)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

/**
 * Opportunity Service
 * TODO: Implement full opportunity management operations
 */
export class OpportunityService {
  static async getOpportunities() {
    const { data, error } = await (supabase as any)
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false});
    
    if (error) throw error;
    return data || [];
  }

  static async getOpportunitiesByCustomer(customerId: string) {
    const { data, error } = await (supabase as any)
      .from("opportunities")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createOpportunity(opportunity: any) {
    const { data, error } = await (supabase as any)
      .from("opportunities")
      .insert(opportunity)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

/**
 * Quote Service
 * TODO: Implement full quote management operations
 */
export class QuoteService {
  static async getQuotes() {
    const { data, error } = await (supabase as any)
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getQuotesByCustomer(customerId: string) {
    const { data, error } = await (supabase as any)
      .from("quotes")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createQuote(quote: any) {
    const { data, error } = await (supabase as any)
      .from("quotes")
      .insert(quote)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

