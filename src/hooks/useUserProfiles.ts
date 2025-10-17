import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared hook for fetching user profiles data
 * Consolidates user profile queries across multiple components
 */
export function useUserProfiles() {
  return useQuery({
    queryKey: ["user-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, full_name, department, email")
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook for fetching a single user profile by user ID
 */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-profiles", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Hook for fetching user profiles with their roles
 */
export function useUserProfilesWithRoles() {
  return useQuery({
    queryKey: ["user-profiles-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          *,
          user_roles(
            role_id,
            roles(name)
          )
        `)
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
  });
}
