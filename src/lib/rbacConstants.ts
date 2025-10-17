/**
 * RBAC Permission Constants
 * Centralized definitions for permission levels, resource types, and actions
 */

/**
 * Permission Levels
 * Hierarchical permission system from least to most privileged
 */
export const PERMISSION_LEVELS = {
  NONE: "none",      // Denied access (hidden entirely)
  VIEW: "view",      // View-only (read-only, no modifications)
  EDIT: "edit",      // Read/write (can modify data)
  ADMIN: "admin",    // Read/write/execute (full access)
} as const;

export type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS];

/**
 * Resource Types
 * Categories of resources that can have permissions
 */
export const RESOURCE_TYPES = {
  PORTAL: "portal",
  PAGE: "page",
  DASHBOARD: "dashboard",
  FEATURE: "feature",
  DATA: "data",
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];

/**
 * Permission Actions
 * Specific actions that can be controlled by permissions
 */
export const PERMISSION_ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  EXECUTE: "execute",
  EXPORT: "export",
  IMPORT: "import",
  MANAGE: "manage",
  ARCHIVE: "archive",
  RESTORE: "restore",
} as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];

/**
 * Permission Level Hierarchy
 * Defines which levels inherit from others
 */
export const PERMISSION_HIERARCHY: Record<PermissionLevel, PermissionLevel[]> = {
  [PERMISSION_LEVELS.NONE]: [],
  [PERMISSION_LEVELS.VIEW]: [PERMISSION_LEVELS.VIEW],
  [PERMISSION_LEVELS.EDIT]: [PERMISSION_LEVELS.VIEW, PERMISSION_LEVELS.EDIT],
  [PERMISSION_LEVELS.ADMIN]: [PERMISSION_LEVELS.VIEW, PERMISSION_LEVELS.EDIT, PERMISSION_LEVELS.ADMIN],
};

/**
 * Action to Permission Level Mapping
 * Defines minimum permission level required for each action
 */
export const ACTION_PERMISSION_MAP: Record<PermissionAction, PermissionLevel> = {
  [PERMISSION_ACTIONS.CREATE]: PERMISSION_LEVELS.EDIT,
  [PERMISSION_ACTIONS.READ]: PERMISSION_LEVELS.VIEW,
  [PERMISSION_ACTIONS.UPDATE]: PERMISSION_LEVELS.EDIT,
  [PERMISSION_ACTIONS.DELETE]: PERMISSION_LEVELS.ADMIN,
  [PERMISSION_ACTIONS.EXECUTE]: PERMISSION_LEVELS.ADMIN,
  [PERMISSION_ACTIONS.EXPORT]: PERMISSION_LEVELS.VIEW,
  [PERMISSION_ACTIONS.IMPORT]: PERMISSION_LEVELS.EDIT,
  [PERMISSION_ACTIONS.MANAGE]: PERMISSION_LEVELS.ADMIN,
  [PERMISSION_ACTIONS.ARCHIVE]: PERMISSION_LEVELS.ADMIN,
  [PERMISSION_ACTIONS.RESTORE]: PERMISSION_LEVELS.ADMIN,
};

/**
 * Common Resource Names
 * Frequently used resource identifiers
 */
export const COMMON_RESOURCES = {
  // Portals
  ADMIN_PORTAL: "admin",
  COMPLIANCE_PORTAL: "compliance",
  WORKFLOWS_PORTAL: "workflows",
  CMDB_PORTAL: "cmdb",
  HELPDESK_PORTAL: "helpdesk",
  
  // Dashboards
  EXECUTIVE_DASHBOARD: "executive",
  OPERATIONS_DASHBOARD: "operations",
  ANALYTICS_DASHBOARD: "analytics",
  
  // Features
  RBAC_MANAGEMENT: "rbac",
  USER_MANAGEMENT: "users",
  REPORTS: "reports",
  SETTINGS: "settings",
} as const;

/**
 * Helper function to check if a permission level includes another
 */
export function permissionIncludes(
  userLevel: PermissionLevel,
  requiredLevel: PermissionLevel
): boolean {
  return PERMISSION_HIERARCHY[userLevel]?.includes(requiredLevel) ?? false;
}

/**
 * Helper function to check if a user can perform an action
 */
export function canPerformAction(
  userLevel: PermissionLevel,
  action: PermissionAction
): boolean {
  const requiredLevel = ACTION_PERMISSION_MAP[action];
  return permissionIncludes(userLevel, requiredLevel);
}

/**
 * Permission badge color configuration
 */
export const PERMISSION_BADGE_COLORS = {
  [PERMISSION_LEVELS.NONE]: {
    text: "text-muted-foreground",
    variant: "outline" as const,
  },
  [PERMISSION_LEVELS.VIEW]: {
    text: "text-blue-600",
    variant: "secondary" as const,
  },
  [PERMISSION_LEVELS.EDIT]: {
    text: "text-green-600",
    variant: "default" as const,
  },
  [PERMISSION_LEVELS.ADMIN]: {
    text: "text-purple-600",
    variant: "default" as const,
  },
};
