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
  user_roles?: Array<{ count: number }>;
}

export interface RolePermission {
  id: string;
  role_id: string;
  resource_type: string;
  resource_name: string;
  permission_level: string;
  conditions?: Record<string, unknown>;
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
   * @returns Array of roles with associated user counts
   * @throws Error if database query fails
   */
  static async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        user_roles(count)
      `)
      .order('name');
    
    if (error) throw new Error(`Failed to fetch roles: ${error.message}`);
    return data as Role[];
  }

  /**
   * Create new role
   * @param roleData - Role name and optional description
   * @returns The created role object
   * @throws Error if role creation fails
   */
  static async createRole(roleData: { name: string; description?: string }): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert(roleData)
      .select()
      .maybeSingle();
    
    if (error) throw new Error(`Failed to create role: ${error.message}`);
    if (!data) throw new Error('Failed to create role: No data returned');
    return data as Role;
  }

  /**
   * Clone role with all its permissions
   * @param roleId - The role's unique identifier to clone
   * @returns The newly created role object
   * @throws Error if role not found or cloning fails
   */
  static async cloneRole(roleId: string): Promise<Role> {
    // Get the role and its permissions
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*, role_permissions(*)')
      .eq('id', roleId)
      .maybeSingle();
    
    if (roleError) throw new Error(`Failed to fetch role: ${roleError.message}`);
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
    
    if (newRoleError) throw new Error(`Failed to create new role: ${newRoleError.message}`);
    if (!newRole) throw new Error('Failed to create new role: No data returned');

    // Copy permissions
    if (role.role_permissions && role.role_permissions.length > 0) {
      const permissionsCopy = role.role_permissions.map((perm: RolePermission) => ({
        role_id: newRole.id,
        resource_type: perm.resource_type,
        resource_name: perm.resource_name,
        permission_level: perm.permission_level,
        conditions: perm.conditions,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(permissionsCopy);
      
      if (permError) throw new Error(`Failed to copy permissions: ${permError.message}`);
    }

    return newRole as Role;
  }

  /**
   * Get permissions for a specific role
   * @param roleId - The role's unique identifier
   * @returns Array of permissions assigned to the role
   * @throws Error if database query fails
   */
  static async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .order('resource_type');
    
    if (error) throw new Error(`Failed to fetch role permissions: ${error.message}`);
    return data as RolePermission[];
  }

  /**
   * Add permission to a role
   * @param roleId - The role's unique identifier
   * @param permission - Permission details to add
   * @returns The created permission object
   * @throws Error if permission creation fails
   */
  static async addPermission(
    roleId: string,
    permission: {
      resource_type: string;
      resource_name: string;
      permission_level: string;
    }
  ): Promise<RolePermission> {
    const { data, error } = await supabase
      .from('role_permissions')
      .insert({
        role_id: roleId,
        ...permission,
      })
      .select()
      .maybeSingle();
    
    if (error) throw new Error(`Failed to add permission: ${error.message}`);
    if (!data) throw new Error('Failed to add permission: No data returned');
    return data as RolePermission;
  }

  /**
   * Delete permission from a role
   * @param permissionId - The permission's unique identifier
   * @throws Error if deletion fails
   */
  static async deletePermission(permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('id', permissionId);
    
    if (error) throw new Error(`Failed to delete permission: ${error.message}`);
  }

  /**
   * Get role hierarchy relationships
   * @returns Array of role hierarchy relationships with parent and child role names
   * @throws Error if database query fails
   */
  static async getRoleHierarchy(): Promise<RoleHierarchy[]> {
    const { data, error } = await supabase
      .from('role_hierarchy' as never)
      .select(`
        *,
        parent_role:roles!role_hierarchy_parent_role_id_fkey(name),
        child_role:roles!role_hierarchy_child_role_id_fkey(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch role hierarchy: ${error.message}`);
    return (data || []) as RoleHierarchy[];
  }

  /**
   * Add role hierarchy relationship
   * @param data - Hierarchy relationship configuration
   * @throws Error if hierarchy creation fails
   */
  static async addHierarchy(data: {
    parent_role_id: string;
    child_role_id: string;
    inherit_permissions: boolean;
  }): Promise<void> {
    const { error } = await supabase
      .from('role_hierarchy' as never)
      .insert(data as never);
    
    if (error) throw new Error(`Failed to add role hierarchy: ${error.message}`);
  }

  /**
   * Delete role hierarchy relationship
   * @param hierarchyId - The hierarchy relationship's unique identifier
   * @throws Error if deletion fails
   */
  static async deleteHierarchy(hierarchyId: string): Promise<void> {
    const { error } = await supabase
      .from('role_hierarchy' as never)
      .delete()
      .eq('id', hierarchyId);
    
    if (error) throw new Error(`Failed to delete role hierarchy: ${error.message}`);
  }

  /**
   * Get permission audit logs
   * @param limit - Maximum number of logs to return (default: 100)
   * @returns Array of audit logs with user information
   * @throws Error if database query fails
   */
  static async getPermissionAuditLogs(limit: number = 100): Promise<PermissionAuditLog[]> {
    const { data, error } = await supabase
      .from('permission_audit_log' as never)
      .select(`
        *,
        user:user_profiles!permission_audit_log_user_id_fkey(full_name),
        target_user:user_profiles!permission_audit_log_target_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);
    return (data || []) as PermissionAuditLog[];
  }

  /**
   * Get role templates
   * @returns Array of role templates
   * @throws Error if database query fails
   */
  static async getRoleTemplates(): Promise<Array<{
    id: string;
    template_name: string;
    description: string;
    template_permissions: unknown[];
  }>> {
    const { data, error } = await supabase
      .from("role_templates" as never)
      .select("*")
      .order("template_name");
    
    if (error) throw new Error(`Failed to fetch role templates: ${error.message}`);
    return (data || []) as Array<{
      id: string;
      template_name: string;
      description: string;
      template_permissions: unknown[];
    }>;
  }

  /**
   * Apply role template to a role
   * @param roleId - The role's unique identifier
   * @param permissions - Array of permissions from the template
   * @throws Error if operation fails
   */
  static async applyRoleTemplate(roleId: string, permissions: Array<{
    resource_type: string;
    resource_name: string;
    permission_level: string;
  }>): Promise<void> {
    // Delete existing permissions for the role
    const { error: deleteError } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId);
    
    if (deleteError) throw new Error(`Failed to delete existing permissions: ${deleteError.message}`);

    // Insert new permissions from template
    const permissionsToInsert = permissions.map(perm => ({
      role_id: roleId,
      resource_type: perm.resource_type,
      resource_name: perm.resource_name,
      permission_level: perm.permission_level,
    }));

    const { error: insertError } = await supabase
      .from("role_permissions")
      .insert(permissionsToInsert);
    
    if (insertError) throw new Error(`Failed to insert template permissions: ${insertError.message}`);
  }

  /**
   * Get temporary privileges
   * @returns Array of temporary privileges with user and role information
   * @throws Error if database query fails
   */
  static async getTemporaryPrivileges(): Promise<Array<{
    id: string;
    user_id: string;
    role_id: string;
    granted_by: string;
    reason: string;
    valid_until: string;
    is_active: boolean;
    created_at: string;
    role: { name: string };
    user: { full_name: string };
    granted_by_user: { full_name: string };
  }>> {
    const { data, error } = await supabase
      .from("temporary_privileges" as never)
      .select(`
        *,
        role:roles(name),
        user:user_profiles!temporary_privileges_user_id_fkey(full_name),
        granted_by_user:user_profiles!temporary_privileges_granted_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw new Error(`Failed to fetch temporary privileges: ${error.message}`);
    return (data || []) as never;
  }

  /**
   * Grant temporary privilege to a user
   * @param data - Temporary privilege data
   * @throws Error if operation fails
   */
  static async grantTemporaryPrivilege(data: {
    userId: string;
    roleId: string;
    grantedBy: string;
    reason: string;
    validHours: number;
  }): Promise<void> {
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + data.validHours);

    const { error } = await supabase
      .from("temporary_privileges" as never)
      .insert({
        user_id: data.userId,
        role_id: data.roleId,
        granted_by: data.grantedBy,
        reason: data.reason,
        valid_until: validUntil.toISOString(),
      } as never);
    
    if (error) throw new Error(`Failed to grant temporary privilege: ${error.message}`);
  }

  /**
   * Revoke temporary privilege
   * @param privilegeId - The privilege's unique identifier
   * @param revokedBy - User ID of the person revoking the privilege
   * @throws Error if operation fails
   */
  static async revokeTemporaryPrivilege(privilegeId: string, revokedBy: string): Promise<void> {
    const { error } = await supabase
      .from("temporary_privileges" as never)
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
      } as never)
      .eq("id", privilegeId);
    
    if (error) throw new Error(`Failed to revoke temporary privilege: ${error.message}`);
  }
}
