import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared hook for fetching roles data
 * Consolidates role queries across multiple components
 */
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook for fetching a single role by ID
 */
export function useRole(roleId: string | undefined) {
  return useQuery({
    queryKey: ["roles", roleId],
    queryFn: async () => {
      if (!roleId) return null;
      
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("id", roleId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!roleId,
  });
}

/**
 * Hook for fetching roles with their permission counts
 */
export function useRolesWithPermissions() {
  return useQuery({
    queryKey: ["roles-with-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select(`
          *,
          role_permissions(count)
        `)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
}
