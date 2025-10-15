/**
 * Centralized Hook Exports
 * Single import point for all custom hooks
 */

export { useAuth } from "./useAuth";
export type { UserProfile, AuthState } from "./useAuth";

export { useDatabase } from "./useDatabase";
export type { DatabaseOptions, QueryOptions } from "./useDatabase";

export { useNotification } from "./useNotification";
export type { NotificationOptions } from "./useNotification";

export { usePermissions, useResourcePermission } from "./usePermissions";
export type { PermissionLevel, PermissionCheck } from "./usePermissions";

export { useDataFetching, useDataItem } from "./useDataFetching";
export type { DataFetchingState, FetchOptions } from "./useDataFetching";

export { useForm } from "./useForm";
export type { FormOptions, FormState, FormHandlers } from "./useForm";

export { useRetry } from "./useRetry";

export { useToast } from "./use-toast";

// Re-export performance utilities
export { useDebounce, useThrottle, useIntersectionObserver, lazyWithRetry } from "../lib/performance";

// Re-export accessibility utilities  
export { trapFocus, announceToScreenReader, handleKeyboardNavigation, meetsWCAGAA } from "../lib/a11y";
