/**
 * Roles Service
 * Centralized roles management
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export class RolesService extends BaseService {
  /**
   * Get all roles
   */
  static async getRoles(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("roles")
        .select("*")
        .order("name");
    });
  }

  /**
   * Get single role by ID
   */
  static async getRole(roleId: string): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("roles")
        .select("*")
        .eq("id", roleId)
        .maybeSingle();
    });
  }

  /**
   * Get roles with permission counts
   */
  static async getRolesWithPermissions(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("roles")
        .select(`
          *,
          role_permissions(count)
        `)
        .order("name");
    });
  }
}
