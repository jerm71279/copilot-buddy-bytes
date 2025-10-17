import { useState, useEffect } from "react";
import { usePermissions, PermissionLevel } from "./usePermissions";
import React from "react";

/**
 * Hook for checking granular permissions on a specific resource
 * Returns permission level and helper booleans for UI state
 */
export function useResourcePermissions(resource: string) {
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>("none");
  const [isLoading, setIsLoading] = useState(true);
  const { getPermissionLevel } = usePermissions();

  useEffect(() => {
    const checkLevel = async () => {
      setIsLoading(true);
      const level = await getPermissionLevel(resource);
      setPermissionLevel(level);
      setIsLoading(false);
    };
    checkLevel();
  }, [resource, getPermissionLevel]);

  return {
    permissionLevel,
    isLoading,
    
    // Helper booleans for UI state
    isDenied: permissionLevel === "none",
    canView: permissionLevel !== "none",
    canEdit: permissionLevel === "edit" || permissionLevel === "admin",
    canExecute: permissionLevel === "admin",
    isReadOnly: permissionLevel === "view",
  };
}

/**
 * Hook for checking action-level permissions
 * Use this to show/hide buttons and actions
 */
export function useActionPermissions(resource: string) {
  const permissions = useResourcePermissions(resource);

  return {
    ...permissions,
    
    // Action-specific checks
    canCreate: permissions.canEdit,
    canUpdate: permissions.canEdit,
    canDelete: permissions.canExecute,
    canManage: permissions.canExecute,
    canExport: permissions.canView,
    canImport: permissions.canEdit,
    canArchive: permissions.canExecute,
    canRestore: permissions.canExecute,
  };
}

/**
 * Component wrapper for permission-based rendering
 */
interface PermissionGateProps {
  resource: string;
  minimumLevel: PermissionLevel;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  resource,
  minimumLevel,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { permissionLevel, isLoading } = useResourcePermissions(resource);

  if (isLoading) {
    return fallback;
  }

  const levels: PermissionLevel[] = ["none", "view", "edit", "admin"];
  const currentLevelIndex = levels.indexOf(permissionLevel);
  const minimumLevelIndex = levels.indexOf(minimumLevel);

  if (currentLevelIndex >= minimumLevelIndex) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
