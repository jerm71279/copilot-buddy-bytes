/**
 * Authentication Service
 * Centralized authentication operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  department: string | null;
  customer_id: string | null;
  email?: string;
}

export class AuthService {
  /**
   * Get current user
   */
  static async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  /**
   * Get current session
   */
  static async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Sign out user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Profile not found:", error);
      return null;
    }

    return data;
  }

  /**
   * Get current access token
   */
  static async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Check if user has admin role
   */
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", userId);

      let isAdmin = roles?.some((ur: any) => 
        ur.roles?.name === "Super Admin" || ur.roles?.name === "Admin"
      ) || false;

      if (!isAdmin) {
        const { data: rpcHasAdmin } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });
        isAdmin = !!rpcHasAdmin;
      }

      return isAdmin;
    } catch (error) {
      console.warn("Could not check admin status:", error);
      return false;
    }
  }

  /**
   * Get customer ID from user profile
   */
  static async getCustomerId(userId: string): Promise<string | null> {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    return profile?.customer_id || null;
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Check permission using RPC
   */
  static async checkPermission(
    userId: string,
    resourceType: string,
    resourceName: string,
    minPermission: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("has_permission", {
        _user_id: userId,
        _resource_type: resourceType,
        _resource_name: resourceName,
        _min_permission: minPermission,
      });

      if (error) {
        console.error("Permission check error:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }

    return data || [];
  }
}
