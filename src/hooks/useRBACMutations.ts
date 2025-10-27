import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Shared RBAC Mutations
 * Consolidates common grant/revoke patterns across RBAC components
 */

interface GrantPermissionParams {
  roleId: string;
  resourceType: string;
  resourceName: string;
  permissionLevel: string;
}

interface RevokePermissionParams {
  permissionId: string;
}

interface AssignRoleParams {
  userId: string;
  roleId: string;
}

interface UnassignRoleParams {
  userId: string;
  roleId: string;
}

/**
 * Mutation for granting permissions to a role
 */
export function useGrantPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GrantPermissionParams) => {
      const { data, error } = await supabase
        .from("role_permissions")
        .insert({
          role_id: params.roleId,
          resource_type: params.resourceType,
          resource_name: params.resourceName,
          permission_level: params.permissionLevel,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Failed to create permission");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles-with-permissions"] });
      toast.success("Permission granted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to grant permission: ${error.message}`);
    },
  });
}

/**
 * Mutation for revoking permissions from a role
 */
export function useRevokePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RevokePermissionParams) => {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("id", params.permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles-with-permissions"] });
      toast.success("Permission revoked successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke permission: ${error.message}`);
    },
  });
}

/**
 * Mutation for assigning a role to a user
 */
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AssignRoleParams) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({
          user_id: params.userId,
          role_id: params.roleId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Failed to assign role");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      queryClient.invalidateQueries({ queryKey: ["user-profiles-with-roles"] });
      toast.success("Role assigned successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });
}

/**
 * Mutation for unassigning a role from a user
 */
export function useUnassignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UnassignRoleParams) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", params.userId)
        .eq("role_id", params.roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      queryClient.invalidateQueries({ queryKey: ["user-profiles-with-roles"] });
      toast.success("Role unassigned successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to unassign role: ${error.message}`);
    },
  });
}

/**
 * Batch mutation for granting multiple permissions at once
 */
export function useGrantPermissionsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissions: GrantPermissionParams[]) => {
      const { data, error } = await supabase
        .from("role_permissions")
        .insert(
          permissions.map((p) => ({
            role_id: p.roleId,
            resource_type: p.resourceType,
            resource_name: p.resourceName,
            permission_level: p.permissionLevel,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles-with-permissions"] });
      toast.success(`${variables.length} permissions granted successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to grant permissions: ${error.message}`);
    },
  });
}

/**
 * Batch mutation for revoking multiple permissions at once
 */
export function useRevokePermissionsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionIds: string[]) => {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .in("id", permissionIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles-with-permissions"] });
      toast.success(`${variables.length} permissions revoked successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke permissions: ${error.message}`);
    },
  });
}
