/**
 * Authentication Service
 * Centralized authentication and authorization logic
 */

import { supabase } from "@/integrations/supabase/client";

export class AuthService {
  /**
   * Check if user has a specific role
   */
  static async hasRole(userId: string, roleName: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", userId);

    if (error) {
      console.error("Error checking role:", error);
      return false;
    }

    return data?.some((ur: any) => ur.roles?.name === roleName) || false;
  }

  /**
   * Check if user is admin (Admin or Super Admin)
   */
  static async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", userId);

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return (
      data?.some(
        (ur: any) =>
          ur.roles?.name === "Super Admin" || ur.roles?.name === "Admin"
      ) || false
    );
  }

  /**
   * Get user's department
   */
  static async getUserDepartment(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("department")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching department:", error);
      return null;
    }

    return data?.department || null;
  }

  /**
   * Get all user roles
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching roles:", error);
      return [];
    }

    return data?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
  }

  /**
   * Get department route based on user's department
   */
  static getDepartmentRoute(department: string | null): string {
    const routes: Record<string, string> = {
      compliance: "/dashboard/compliance",
      it: "/dashboard/it",
      operations: "/dashboard/operations",
      hr: "/dashboard/hr",
      finance: "/dashboard/finance",
      executive: "/dashboard/executive",
    };
    return routes[department?.toLowerCase() || ""] || "/portal";
  }
}
