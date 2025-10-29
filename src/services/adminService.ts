/**
 * Admin Service
 * Centralized data operations for Admin Dashboard
 */

import { supabase } from "@/integrations/supabase/client";

export type Customer = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  status: string;
  plan_type: string;
  created_at: string;
};

export class AdminService {
  /**
   * Fetch all customers
   */
  static async getCustomers(): Promise<Customer[]> {
    const { data, error } = await (supabase as any)
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get first customer ID (for preview mode)
   */
  static async getFirstCustomerId(): Promise<string | null> {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .limit(1)
      .maybeSingle();
    
    return data?.id || null;
  }

  /**
   * Check if user has admin role
   */
  static async checkAdminRole(userId: string): Promise<boolean> {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", userId);

    let hasAdmin = roles?.some((ur: any) => 
      ur.roles?.name === 'Super Admin' || ur.roles?.name === 'Admin'
    );

    if (!hasAdmin) {
      const { data: rpcHasAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      hasAdmin = !!rpcHasAdmin;
    }

    return hasAdmin;
  }

  /**
   * Get user's customer ID
   */
  static async getUserCustomerId(userId: string): Promise<string | null> {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    return profile?.customer_id || null;
  }
}
