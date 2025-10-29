/**
 * Roles Service
 * Centralized roles management
 */

import { supabase } from "@/integrations/supabase/client";

export class RolesService {
  /**
   * Get all roles
   */
  static async getRoles() {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("name");
    
    if (error) throw error;
    return data;
  }

  /**
   * Get single role by ID
   */
  static async getRole(roleId: string) {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get roles with permission counts
   */
  static async getRolesWithPermissions() {
    const { data, error } = await supabase
      .from("roles")
      .select(`
        *,
        role_permissions(count)
      `)
      .order("name");
    
    if (error) throw error;
    return data;
  }
}
