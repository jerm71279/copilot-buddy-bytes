/**
 * RBAC Service
 * Role-Based Access Control management
 */

import { BaseService, ServiceResponse } from "./baseService";
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

export class RBACService extends BaseService {
  /**
   * Get all roles with user counts
   * @returns Array of roles with associated user counts
   */
  static async getRoles(): Promise<ServiceResponse<Role[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('roles')
        .select(`
          *,
          user_roles(count)
        `)
        .order('name');
    });
  }

  /**
   * Create new role
   * @param roleData - Role name and optional description
   * @returns The created role object
   */
  static async createRole(roleData: { name: string; description?: string }): Promise<ServiceResponse<Role>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('roles')
        .insert(roleData)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Clone role with all its permissions
   * @param roleId - The role's unique identifier to clone
   * @returns The newly created role object
   */
  static async cloneRole(roleId: string): Promise<ServiceResponse<Role>> {
    return this.executeQuery(async () => {
      // Get the role and its permissions
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*, role_permissions(*)')
        .eq('id', roleId)
        .maybeSingle();
      
      if (roleError) return { data: null, error: roleError };
      if (!role) return { data: null, error: { message: 'Role not found' } as any };

      // Create new role
      const { data: newRole, error: newRoleError } = await supabase
        .from('roles')
        .insert({
          name: `${role.name} (Copy)`,
          description: role.description,
        })
        .select()
        .maybeSingle();
      
      if (newRoleError) return { data: null, error: newRoleError };
      if (!newRole) return { data: null, error: { message: 'Failed to create new role' } as any };

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
        
        if (permError) return { data: null, error: permError };
      }

      return { data: newRole as Role, error: null };
    });
  }

  /**
   * Get permissions for a specific role
   * @param roleId - The role's unique identifier
   * @returns Array of permissions assigned to the role
   */
  static async getRolePermissions(roleId: string): Promise<ServiceResponse<RolePermission[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', roleId)
        .order('resource_type');
    });
  }

  /**
   * Add permission to a role
   * @param roleId - The role's unique identifier
   * @param permission - Permission details to add
   * @returns The created permission object
   */
  static async addPermission(
    roleId: string,
    permission: {
      resource_type: string;
      resource_name: string;
      permission_level: string;
    }
  ): Promise<ServiceResponse<RolePermission>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('role_permissions')
        .insert({
          role_id: roleId,
          ...permission,
        })
        .select()
        .maybeSingle();
    });
  }

  /**
   * Delete permission from a role
   * @param permissionId - The permission's unique identifier
   */
  static async deletePermission(permissionId: string): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', permissionId);
      return { data: null, error };
    });
  }

  /**
   * Get role hierarchy relationships
   * @returns Array of role hierarchy relationships with parent and child role names
   */
  static async getRoleHierarchy(): Promise<ServiceResponse<RoleHierarchy[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('role_hierarchy' as never)
        .select(`
          *,
          parent_role:roles!role_hierarchy_parent_role_id_fkey(name),
          child_role:roles!role_hierarchy_child_role_id_fkey(name)
        `)
        .order('created_at', { ascending: false });
    });
  }

  /**
   * Add role hierarchy relationship
   * @param data - Hierarchy relationship configuration
   */
  static async addHierarchy(data: {
    parent_role_id: string;
    child_role_id: string;
    inherit_permissions: boolean;
  }): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('role_hierarchy' as never)
        .insert(data as never);
      return { data: null, error };
    });
  }

  /**
   * Delete role hierarchy relationship
   * @param hierarchyId - The hierarchy relationship's unique identifier
   */
  static async deleteHierarchy(hierarchyId: string): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('role_hierarchy' as never)
        .delete()
        .eq('id', hierarchyId);
      return { data: null, error };
    });
  }

  /**
   * Get permission audit logs
   * @param limit - Maximum number of logs to return (default: 100)
   * @returns Array of audit logs with user information
   */
  static async getPermissionAuditLogs(limit: number = 100): Promise<ServiceResponse<PermissionAuditLog[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('permission_audit_log' as never)
        .select(`
          *,
          user:user_profiles!permission_audit_log_user_id_fkey(full_name),
          target_user:user_profiles!permission_audit_log_target_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
    });
  }

  /**
   * Get role templates
   * @returns Array of role templates
   */
  static async getRoleTemplates(): Promise<ServiceResponse<Array<{
    id: string;
    template_name: string;
    description: string;
    template_permissions: unknown[];
  }>>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("role_templates" as never)
        .select("*")
        .order("template_name");
    });
  }

  /**
   * Apply role template to a role
   * @param roleId - The role's unique identifier
   * @param permissions - Array of permissions from the template
   */
  static async applyRoleTemplate(roleId: string, permissions: Array<{
    resource_type: string;
    resource_name: string;
    permission_level: string;
  }>): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      // Delete existing permissions for the role
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId);
      
      if (deleteError) return { data: null, error: deleteError };

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
      
      return { data: null, error: insertError };
    });
  }

  /**
   * Get temporary privileges
   * @returns Array of temporary privileges with user and role information
   */
  static async getTemporaryPrivileges(): Promise<ServiceResponse<Array<{
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
  }>>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("temporary_privileges" as never)
        .select(`
          *,
          role:roles(name),
          user:user_profiles!temporary_privileges_user_id_fkey(full_name),
          granted_by_user:user_profiles!temporary_privileges_granted_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });
    });
  }

  /**
   * Grant temporary privilege to a user
   * @param data - Temporary privilege data
   */
  static async grantTemporaryPrivilege(data: {
    userId: string;
    roleId: string;
    grantedBy: string;
    reason: string;
    validHours: number;
  }): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
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
      
      return { data: null, error };
    });
  }

  /**
   * Revoke temporary privilege
   * @param privilegeId - The privilege's unique identifier
   * @param revokedBy - User ID of the person revoking the privilege
   */
  static async revokeTemporaryPrivilege(privilegeId: string, revokedBy: string): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from("temporary_privileges" as never)
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy,
        } as never)
        .eq("id", privilegeId);
      
      return { data: null, error };
    });
  }
}
