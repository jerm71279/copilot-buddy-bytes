/**
 * Profile Service
 * Handles user profile and customer settings
 */

import { BaseService, ServiceResponse } from "./baseService";
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

export class ProfileService extends BaseService {
  /**
   * Get user profile
   */
  static async getUserProfile(userId: string): Promise<ServiceResponse<UserProfile | null>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    });
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string): Promise<ServiceResponse<Customer | null>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();
    });
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Update customer
   */
  static async updateCustomer(customerId: string, updates: any): Promise<ServiceResponse<Customer>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Get all user profiles (for admin/directory)
   */
  static async getAllProfiles(customerId?: string): Promise<ServiceResponse<UserProfile[]>> {
    return this.executeQuery(async () => {
      let query = supabase
        .from('user_profiles')
        .select('*')
        .order('full_name');

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      return await query;
    });
  }

  /**
   * Get customer customizations
   * @param customerId - Customer's unique identifier
   * @returns Customer customization settings
   */
  static async getCustomerCustomizations(customerId: string): Promise<ServiceResponse<{
    enabled_portals: string[];
    enabled_modules: Record<string, boolean>;
  } | null>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("customer_customizations")
        .select("enabled_portals, enabled_modules")
        .eq("customer_id", customerId)
        .maybeSingle();

      if (error) return { data: null, error };
      
      if (!data) return { data: null, error: null };

      return {
        data: {
          enabled_portals: data.enabled_portals 
            ? (data.enabled_portals as unknown[]).filter((p): p is string => typeof p === 'string')
            : [],
          enabled_modules: data.enabled_modules && typeof data.enabled_modules === 'object'
            ? data.enabled_modules as Record<string, boolean>
            : {}
        },
        error: null
      };
    });
  }

  /**
   * Get all user profiles for selection (e.g., temporary privileges)
   * @returns Array of user profiles with user_id and full_name
   */
  static async getUserProfilesForSelection(): Promise<ServiceResponse<Array<{
    user_id: string;
    full_name: string | null;
  }>>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("user_profiles")
        .select("user_id, full_name")
        .order("full_name");
    });
  }
}
