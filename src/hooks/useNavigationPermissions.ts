import { useState, useEffect, useMemo } from "react";
import { usePermissions } from "./usePermissions";

/**
 * Navigation Permission Filter Hook
 * Filters navigation items based on user's RBAC permissions
 */

interface NavigationItem {
  name: string;
  path: string;
  children?: NavigationItem[];
  icon?: any;
  description?: string;
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
  const { checkPermission } = usePermissions();
  const [filteredItems, setFilteredItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const filterItems = async () => {
      setIsLoading(true);
      
      const filtered: (T | null)[] = await Promise.all(
        items.map(async (item) => {
          // Extract resource name from path (e.g., "/admin" -> "admin")
          const resourceName = item.path.split("/").filter(Boolean)[0] || item.path;
          
          // Check if user has permission for this item
          const hasPermission = await checkPermission(
            resourceName,
            minPermission
          );

          if (!hasPermission) {
            return null;
          }

          // If item has children, filter them recursively
          if (item.children && item.children.length > 0) {
            const filteredChildren: (NavigationItem | null)[] = await Promise.all(
              item.children.map(async (child) => {
                const childResourceName = child.path.split("/").filter(Boolean)[0] || child.path;
                const hasChildPermission = await checkPermission(
                  childResourceName,
                  minPermission
                );
                return hasChildPermission ? child : null;
              })
            );

            // Only include parent if it has at least one accessible child
            const accessibleChildren = filteredChildren.filter(
              (child): child is NavigationItem => child !== null
            );

            if (accessibleChildren.length === 0) {
              return null;
            }

            return {
              ...item,
              children: accessibleChildren as T["children"],
            } as T;
          }

          return item;
        })
      );

      setFilteredItems(filtered.filter((item): item is T => item !== null));
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
