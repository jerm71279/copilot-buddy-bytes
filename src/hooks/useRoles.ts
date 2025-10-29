import { useQuery } from "@tanstack/react-query";
import { RolesService } from "@/services/rolesService";

/**
 * Shared hook for fetching roles data
 * Consolidates role queries across multiple components
 */
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => RolesService.getRoles(),
  });
}

/**
 * Hook for fetching a single role by ID
 */
export function useRole(roleId: string | undefined) {
  return useQuery({
    queryKey: ["roles", roleId],
    queryFn: () => roleId ? RolesService.getRole(roleId) : null,
    enabled: !!roleId,
  });
}

/**
 * Hook for fetching roles with their permission counts
 */
export function useRolesWithPermissions() {
  return useQuery({
    queryKey: ["roles-with-permissions"],
    queryFn: () => RolesService.getRolesWithPermissions(),
  });
}
