import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { AuthService } from "@/services/authService";

/**
 * Centralized Permission Management Hook
 * Supports granular permission levels:
 * - none: Denied access (hidden entirely)
 * - view: View-only (read-only, no modifications)
 * - edit: Read/write (can modify data)
 * - admin: Read/write/execute (full access including special operations)
 */

export type PermissionLevel = "none" | "view" | "edit" | "admin";

export interface PermissionCheck {
  hasPermission: boolean;
  isLoading: boolean;
  checkPermission: (
    resource: string,
    level?: PermissionLevel
  ) => Promise<boolean>;
  getPermissionLevel: (resource: string) => Promise<PermissionLevel>;
}

export function usePermissions(): PermissionCheck {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const permissionCacheRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    setIsLoading(authLoading);
  }, [authLoading]);

  const checkPermission = useCallback(async (
    resource: string,
    level: PermissionLevel = "view"
  ): Promise<boolean> => {
    if (!user) return false;
    if (level === "none") return false; // Explicitly denied
    
    // Super Admins have full access to everything
    if (isAdmin) return true;

    const cacheKey = `${resource}:${level}`;
    
    // Check cache using ref (doesn't trigger re-renders)
    if (permissionCacheRef.current.has(cacheKey)) {
      return permissionCacheRef.current.get(cacheKey)!;
    }

    try {
      const data = await AuthService.checkPermission(
        user.id,
        "portal",
        resource,
        level
      );

      const hasAccess = data === true;
      permissionCacheRef.current.set(cacheKey, hasAccess);
      return hasAccess;
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  }, [user, isAdmin]);

  const getPermissionLevel = useCallback(async (resource: string): Promise<PermissionLevel> => {
    if (!user) return "none";
    
    // Super Admins always have admin level access
    if (isAdmin) return "admin";

    // Check from highest to lowest permission level
    const levels: PermissionLevel[] = ["admin", "edit", "view"];
    
    for (const level of levels) {
      const hasAccess = await checkPermission(resource, level);
      if (hasAccess) {
        return level;
      }
    }
    
    return "none"; // No access
  }, [user, isAdmin, checkPermission]);

  return {
    hasPermission: false, // Use checkPermission for actual checks
    isLoading,
    checkPermission,
    getPermissionLevel,
  };
}

/**
 * Hook for checking specific resource permission
 */
export function useResourcePermission(
  resource: string,
  level: PermissionLevel = "view"
) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { checkPermission } = usePermissions();

  useEffect(() => {
    const check = async () => {
      setIsLoading(true);
      const result = await checkPermission(resource, level);
      setHasPermission(result);
      setIsLoading(false);
    };
    check();
  }, [resource, level, checkPermission]);

  return { hasPermission, isLoading };
}
