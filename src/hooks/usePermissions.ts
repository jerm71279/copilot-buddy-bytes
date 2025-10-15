import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Centralized Permission Management Hook
 * Eliminates repeated permission checks
 */

export type PermissionLevel = "view" | "edit" | "admin";

export interface PermissionCheck {
  hasPermission: boolean;
  isLoading: boolean;
  checkPermission: (
    resource: string,
    level?: PermissionLevel
  ) => Promise<boolean>;
}

export function usePermissions(): PermissionCheck {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [permissionCache, setPermissionCache] = useState<
    Map<string, boolean>
  >(new Map());

  useEffect(() => {
    setIsLoading(authLoading);
  }, [authLoading]);

  const checkPermission = async (
    resource: string,
    level: PermissionLevel = "view"
  ): Promise<boolean> => {
    if (!user) return false;

    const cacheKey = `${resource}:${level}`;
    if (permissionCache.has(cacheKey)) {
      return permissionCache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase.rpc("has_permission", {
        _user_id: user.id,
        _resource_type: "portal",
        _resource_name: resource,
        _min_permission: level,
      });

      if (error) {
        console.error("Permission check error:", error);
        return false;
      }

      const hasAccess = data === true;
      setPermissionCache((prev) => new Map(prev).set(cacheKey, hasAccess));
      return hasAccess;
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  };

  return {
    hasPermission: false, // Use checkPermission for actual checks
    isLoading,
    checkPermission,
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
  }, [resource, level]);

  return { hasPermission, isLoading };
}
