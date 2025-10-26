import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Hook to require authentication on a page
 * Automatically redirects to auth page if user is not authenticated
 * 
 * @param redirectTo - Path to redirect to if not authenticated (default: '/auth')
 * @param options - Additional options
 * @returns Object containing authentication state and user info
 * 
 * @example
 * ```tsx
 * export default function ProtectedPage() {
 *   const { isLoading } = useRequireAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return <div>Protected content</div>;
 * }
 * ```
 * 
 * @example
 * // Custom redirect path
 * ```tsx
 * useRequireAuth('/client-auth');
 * ```
 * 
 * @example
 * // With callback after auth check
 * ```tsx
 * const { user } = useRequireAuth('/auth', {
 *   onAuthenticated: async () => {
 *     await loadUserData();
 *   }
 * });
 * ```
 */
export const useRequireAuth = (
  redirectTo: string = '/auth',
  options?: {
    onAuthenticated?: () => void | Promise<void>;
    requireAdmin?: boolean;
  }
) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo);
    } else if (!isLoading && isAuthenticated) {
      // Check admin requirement
      if (options?.requireAdmin && !isAdmin) {
        navigate('/unauthorized');
        return;
      }
      
      // Call onAuthenticated callback if provided
      if (options?.onAuthenticated) {
        void options.onAuthenticated();
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, navigate, redirectTo, options]);

  return {
    isAuthenticated,
    isLoading,
    user,
    isAdmin,
  };
};
