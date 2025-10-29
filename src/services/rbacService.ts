/**
 * RBAC Service
 * Handles role-based access control operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface Role {
  id: string;
  name: string;
  description?: string;
  customer_id?: string;
  created_at: string;
}

export interface Permission {
  id: string;
  role_id: string;
  resource_type: string;
  resource_name: string;
  permission_level: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: string;
}

export class RBACService {
  /**
   * Assign role to user
   */
  static async assignRole(userId: string, roleId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role_id: roleId }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Remove role from user
   */
  static async removeRole(userId: string, roleId: string) {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw error;
  }

  /**
   * Create role
   */
  static async createRole(role: any) {
    const { data, error } = await supabase
      .from('roles')
      .insert([role])
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to create role');
    return data as Role;
  }

  /**
   * Update role
   */
  static async updateRole(roleId: string, updates: Partial<Role>) {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to update role');
    return data as Role;
  }

  /**
   * Delete role
   */
  static async deleteRole(roleId: string) {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;
  }

  /**
   * Get roles
   */
  static async getRoles(customerId?: string) {
    let query = supabase
      .from('roles')
      .select('*')
      .order('name');

    if (customerId) {
      query = query.or(`customer_id.eq.${customerId},customer_id.is.null`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Role[];
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  /**
   * Create permission
   */
  static async createPermission(permission: any) {
    const { data, error } = await supabase
      .from('role_permissions')
      .insert([permission])
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to create permission');
    return data as Permission;
  }

  /**
   * Delete permission
   */
  static async deletePermission(permissionId: string) {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('id', permissionId);

    if (error) throw error;
  }

  /**
   * Get role permissions
   */
  static async getRolePermissions(roleId: string) {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (error) throw error;
    return data as Permission[];
  }
}
