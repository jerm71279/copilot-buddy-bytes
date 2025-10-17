import { useState, useEffect, useMemo } from "react";
import { usePermissions, PermissionLevel } from "./usePermissions";

/**
 * Navigation Permission Filter Hook
 * Filters navigation items based on user's RBAC permissions
 * Also returns permission level for each item to control UI actions
 */

export interface NavigationItem {
  name: string;
  path: string;
  children?: NavigationItem[];
  icon?: any;
  description?: string;
}

export interface NavigationItemWithPermission<T extends NavigationItem> extends NavigationItem {
  permissionLevel: PermissionLevel; // Now includes "none" | "view" | "edit" | "admin"
  canView: boolean;
  canEdit: boolean;
  canExecute: boolean;
  isReadOnly: boolean;
  originalItem: T;
}

interface UseNavigationPermissionsOptions {
  resourceType?: "portal" | "page" | "dashboard";
  minPermission?: "view" | "edit" | "admin";
}

export function useNavigationPermissions<T extends NavigationItem>(
  items: T[],
  options: UseNavigationPermissionsOptions = {}
) {
  const { resourceType = "portal", minPermission = "view" } = options;
  const { checkPermission, getPermissionLevel } = usePermissions();
  const [filteredItems, setFilteredItems] = useState<NavigationItemWithPermission<T>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const filterItems = async () => {
      setIsLoading(true);
      
      const filtered: (NavigationItemWithPermission<T> | null)[] = await Promise.all(
        items.map(async (item) => {
          // Extract resource name from path (e.g., "/admin" -> "admin")
          const resourceName = item.path.split("/").filter(Boolean)[0] || item.path;
          
          // Get the user's permission level for this resource
          const permissionLevel = await getPermissionLevel(resourceName);

          // If no permission (none), hide completely
          if (permissionLevel === "none") {
            return null;
          }

          // Check if meets minimum permission requirement
          const hasMinPermission = await checkPermission(
            resourceName,
            minPermission
          );

          if (!hasMinPermission) {
            return null;
          }

          // Calculate permission flags
          // Note: At this point, permissionLevel cannot be "none" (filtered out above)
          const canView = true; // Always true if we reach here
          const canEdit = (permissionLevel === "edit" || permissionLevel === "admin");
          const canExecute = (permissionLevel === "admin");
          const isReadOnly = (permissionLevel === "view");

          // If item has children, filter them recursively
          let processedChildren: any = undefined;
          
          if (item.children && item.children.length > 0) {
            const childrenResults = await Promise.all(
              item.children.map(async (child) => {
                const childResourceName = child.path.split("/").filter(Boolean)[0] || child.path;
                const childPermissionLevel = await getPermissionLevel(childResourceName);
                
                if (childPermissionLevel === "none") {
                  return null;
                }

                const hasChildMinPermission = await checkPermission(
                  childResourceName,
                  minPermission
                );

                if (!hasChildMinPermission) {
                  return null;
                }

                return {
                  ...child,
                  permissionLevel: childPermissionLevel,
                  canView: true, // Always true if we reach here
                  canEdit: (childPermissionLevel === "edit" || childPermissionLevel === "admin"),
                  canExecute: (childPermissionLevel === "admin"),
                  isReadOnly: (childPermissionLevel === "view"),
                  originalItem: child,
                } as any;
              })
            );

            const accessibleChildren = childrenResults.filter((child): child is any => child !== null);

            if (accessibleChildren.length === 0) {
              return null;
            }

            processedChildren = accessibleChildren;
          }

          return {
            ...item,
            permissionLevel,
            canView,
            canEdit,
            canExecute,
            isReadOnly,
            originalItem: item,
            children: processedChildren,
          } as any as NavigationItemWithPermission<T>;
        })
      );

      setFilteredItems(
        filtered.filter((item): item is NavigationItemWithPermission<T> => item !== null)
      );
      setIsLoading(false);
    };

    filterItems();
  }, [items, resourceType, minPermission]);

  return {
    items: filteredItems,
    isLoading,
  };
}

/**
 * Hook for filtering portals based on permissions
 */
export function usePortalPermissions<T extends NavigationItem>(portals: T[]) {
  return useNavigationPermissions(portals, {
    resourceType: "portal",
    minPermission: "view",
  });
}

/**
 * Hook for filtering dashboards based on permissions
 */
export function useDashboardPermissions<T extends NavigationItem>(dashboards: T[]) {
  return useNavigationPermissions(dashboards, {
    resourceType: "dashboard",
    minPermission: "view",
  });
}

/**
 * Hook for filtering tools/pages based on permissions
 */
export function useToolPermissions<T extends NavigationItem>(tools: T[]) {
  return useNavigationPermissions(tools, {
    resourceType: "page",
    minPermission: "view",
  });
}
