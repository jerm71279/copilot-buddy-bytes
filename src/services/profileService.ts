/**
 * Profile Service
 * Handles user profile and customer settings
 */

import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  company_name: string;
  customer_type: string;
  industry?: string;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name?: string;
  department?: string;
  customer_id?: string;
  created_at: string;
  updated_at: string;
}

export class ProfileService {
  /**
   * Get user profile
   */
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as UserProfile | null;
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (error) throw error;
    return data as Customer | null;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to update profile');
    return data as UserProfile;
  }

  /**
   * Update customer
   */
  static async updateCustomer(customerId: string, updates: any) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to update customer');
    return data as Customer;
  }

  /**
   * Get all user profiles (for admin/directory)
   */
  static async getAllProfiles(customerId?: string) {
    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('full_name');

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as UserProfile[];
  }

  /**
   * Get customer customizations
   * @param customerId - Customer's unique identifier
   * @returns Customer customization settings
   * @throws Error if database query fails
   */
  static async getCustomerCustomizations(customerId: string): Promise<{
    enabled_portals: string[];
    enabled_modules: Record<string, boolean>;
  } | null> {
    const { data, error } = await supabase
      .from("customer_customizations")
      .select("enabled_portals, enabled_modules")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch customer customizations: ${error.message}`);
    
    if (!data) return null;

    return {
      enabled_portals: data.enabled_portals 
        ? (data.enabled_portals as unknown[]).filter((p): p is string => typeof p === 'string')
        : [],
      enabled_modules: data.enabled_modules && typeof data.enabled_modules === 'object'
        ? data.enabled_modules as Record<string, boolean>
        : {}
    };
  }

  /**
   * Get all user profiles for selection (e.g., temporary privileges)
   * @returns Array of user profiles with user_id and full_name
   * @throws Error if database query fails
   */
  static async getUserProfilesForSelection(): Promise<Array<{
    user_id: string;
    full_name: string | null;
  }>> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id, full_name")
      .order("full_name");
    
    if (error) throw new Error(`Failed to fetch user profiles: ${error.message}`);
    return (data || []) as Array<{
      user_id: string;
      full_name: string | null;
    }>;
  }
}
