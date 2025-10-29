/**
 * RBAC Service
 * Role-Based Access Control management
 */

import { supabase } from "@/integrations/supabase/client";

export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  user_roles?: any[];
}

export interface RolePermission {
  id: string;
  role_id: string;
  resource_type: string;
  resource_name: string;
  permission_level: string;
  conditions?: any;
}

export interface RoleHierarchy {
  id: string;
  parent_role_id: string;
  child_role_id: string;
  inherit_permissions: boolean;
  created_at: string;
  parent_role: {
    name: string;
  };
  child_role: {
    name: string;
  };
}

export interface PermissionAuditLog {
  id: string;
  user_id?: string;
  target_user_id?: string;
  action_type: string;
  resource_type?: string;
  permission_level?: string;
  created_at: string;
  user?: {
    full_name?: string;
  };
  target_user?: {
    full_name?: string;
  };
}

export class RBACService {
  /**
   * Get all roles with user counts
   */
  static async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        user_roles(count)
      `)
      .order('name');
    
    if (error) throw error;
    return data as Role[];
  }

  /**
   * Create new role
   */
  static async createRole(roleData: { name: string; description?: string }) {
    const { data, error } = await supabase
      .from('roles')
      .insert(roleData)
      .select()
      .maybeSingle();
    
    if (error || !data) throw error || new Error('Failed to create role');
    return data as Role;
  }

  /**
   * Clone role with permissions
   */
  static async cloneRole(roleId: string) {
    // Get the role and its permissions
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*, role_permissions(*)')
      .eq('id', roleId)
      .maybeSingle();
    
    if (roleError) throw roleError;
    if (!role) throw new Error('Role not found');

    // Create new role
    const { data: newRole, error: newRoleError } = await supabase
      .from('roles')
      .insert({
        name: `${role.name} (Copy)`,
        description: role.description,
      })
      .select()
      .maybeSingle();
    
    if (newRoleError || !newRole) throw newRoleError || new Error('Failed to create new role');

    // Copy permissions
    if (role.role_permissions && role.role_permissions.length > 0) {
      const permissionsCopy = role.role_permissions.map((perm: any) => ({
        role_id: newRole.id,
        resource_type: perm.resource_type,
        resource_name: perm.resource_name,
        permission_level: perm.permission_level,
        conditions: perm.conditions,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(permissionsCopy);
      
      if (permError) throw permError;
    }

    return newRole;
  }

  /**
   * Get permissions for a role
   */
  static async getRolePermissions(roleId: string) {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .order('resource_type');
    
    if (error) throw error;
    return data as RolePermission[];
  }

  /**
   * Add permission to role
   */
  static async addPermission(
    roleId: string,
    permission: {
      resource_type: string;
      resource_name: string;
      permission_level: string;
    }
  ) {
    const { data, error } = await supabase
      .from('role_permissions')
      .insert({
        role_id: roleId,
        ...permission,
      })
      .select()
      .maybeSingle();
    
    if (error || !data) throw error || new Error('Failed to add permission');
    return data;
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
   * Get role hierarchy
   */
  static async getRoleHierarchy() {
    const { data, error } = await supabase
      .from('role_hierarchy' as any)
      .select(`
        *,
        parent_role:roles!role_hierarchy_parent_role_id_fkey(name),
        child_role:roles!role_hierarchy_child_role_id_fkey(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as any;
  }

  /**
   * Add role hierarchy
   */
  static async addHierarchy(data: {
    parent_role_id: string;
    child_role_id: string;
    inherit_permissions: boolean;
  }) {
    const { error } = await supabase
      .from('role_hierarchy' as any)
      .insert(data);
    
    if (error) throw error;
  }

  /**
   * Delete role hierarchy
   */
  static async deleteHierarchy(hierarchyId: string) {
    const { error } = await supabase
      .from('role_hierarchy' as any)
      .delete()
      .eq('id', hierarchyId);
    
    if (error) throw error;
  }

  /**
   * Get permission audit logs
   */
  static async getPermissionAuditLogs(limit: number = 100) {
    const { data, error } = await supabase
      .from('permission_audit_log' as any)
      .select(`
        *,
        user:user_profiles!permission_audit_log_user_id_fkey(full_name),
        target_user:user_profiles!permission_audit_log_target_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data || []) as any;
  }
}
