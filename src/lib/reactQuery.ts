import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 * Optimized settings for caching, refetching, and error handling
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Refetch on reconnect to get latest data
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Query Keys Factory
 * Centralized query key management for consistency
 */
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  user: (userId: string) => ['user', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  
  // Data fetching
  table: (tableName: string, filters?: Record<string, any>) => 
    ['table', tableName, filters] as const,
  item: (tableName: string, id: string) => 
    ['item', tableName, id] as const,
  
  // Permissions
  permissions: (userId: string) => ['permissions', userId] as const,
  resourcePermission: (userId: string, resource: string, action: string) =>
    ['permission', userId, resource, action] as const,
};

/**
 * Prefetch utility for optimistic data loading
 */
export async function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}

/**
 * Invalidate queries utility for cache updates
 */
export function invalidateQueries(queryKey: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey });
}
