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
export type { RetryOptions } from "./useRetry";

export { useToast } from "./use-toast";

// Portal data hooks
export { usePortalData, useCustomerId } from "./usePortalData";

// Keyboard shortcut hook
export { useKeyboardShortcut } from "./useKeyboardShortcut";

// Onboarding hooks
export { calculateProgress, updateOnboardingProgress, syncOnboardingProgress } from "./useOnboardingProgress";
export type { OnboardingTask, ProgressCalculation } from "./useOnboardingProgress";
export { useOnboardingTemplateTasks } from "./useOnboardingTemplateTasks";
export { useOnboardingRoles, useOnboardingUsers, useOnboardingTemplates } from "./useOnboardingData";
export type { Role, User, Template } from "./useOnboardingData";

// MCP Server hooks
export { useMCPServers } from "./useMCPServers";

// Re-export performance utilities
export { useDebounce, useThrottle, useIntersectionObserver, lazyWithRetry } from "../lib/performance";

// Re-export accessibility utilities  
export { trapFocus, announceToScreenReader, handleKeyboardNavigation, meetsWCAGAA } from "../lib/a11y";

// Memoization utilities
export * from "../lib/memoization";

// Virtual scrolling
export { useVirtualScroll, useVirtualGrid } from "../lib/virtualScroll";

// Monitoring
export { initWebVitals, markPerformance, measurePerformance, observeLongTasks, getMemoryUsage } from "../lib/monitoring";
