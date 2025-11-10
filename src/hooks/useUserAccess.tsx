/**
 * useUserAccess Hook
 *
 * Provides access control utilities for distinguishing between
 * MSP employees and client users. Ready for is_client_user enforcement.
 *
 * IMPORTANT: This hook is prepared for the is_client_user column.
 * Currently returns mock data until database migration is complete.
 *
 * @see CRITICAL_SECURITY_CLIENT_USER_ENFORCEMENT.md
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface UserProfile {
  user_id: string;
  email: string;
  customer_id: string;
  department: string;
  is_client_user: boolean; // Will be available after DB migration
}

export interface UserAccess {
  profile: UserProfile | null;
  isLoading: boolean;
  isClientUser: boolean;
  isMSPEmployee: boolean;
  canAccessAdminPortal: boolean;
  canAccessClientPortal: boolean;
  canManageAllCustomers: boolean;
  customerId: string | null;
}

/**
 * Hook to check user access levels and permissions
 *
 * @param options Configuration options
 * @returns User access information and permissions
 */
export const useUserAccess = (options?: {
  requireAuth?: boolean;
  redirectTo?: string;
}): UserAccess => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (options?.requireAuth) {
            toast.error('Please log in to continue');
            navigate(options.redirectTo || '/auth');
          }
          setIsLoading(false);
          return;
        }

        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('user_id, email, customer_id, department')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error loading user profile:', error);
          if (options?.requireAuth) {
            toast.error('Failed to load user profile');
            navigate(options.redirectTo || '/auth');
          }
          setIsLoading(false);
          return;
        }

        // TODO: Once is_client_user column exists, fetch it from database
        // For now, we'll use a temporary detection method based on email or department
        // TEMPORARY: Assume all users are MSP employees until migration
        const is_client_user = false; // Will be: profileData.is_client_user

        // Alternative temporary detection (uncomment after discussing with team):
        // const is_client_user = profileData.email?.includes('@client') || false;

        setProfile({
          ...profileData,
          is_client_user,
        } as UserProfile);

      } catch (error) {
        console.error('Error in useUserAccess:', error);
        if (options?.requireAuth) {
          toast.error('Authentication error');
          navigate(options.redirectTo || '/auth');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate, options?.requireAuth, options?.redirectTo]);

  // Computed access flags
  const isClientUser = profile?.is_client_user ?? false;
  const isMSPEmployee = !isClientUser;

  return {
    profile,
    isLoading,
    isClientUser,
    isMSPEmployee,
    canAccessAdminPortal: isMSPEmployee && profile?.department === 'admin',
    canAccessClientPortal: true, // Both MSP employees and clients can access (MSP for support)
    canManageAllCustomers: isMSPEmployee, // Only MSP employees see all customers
    customerId: profile?.customer_id || null,
  };
};

/**
 * Hook to enforce MSP employee-only access
 * Redirects client users away from admin/internal pages
 *
 * Usage:
 * ```tsx
 * export default function AdminDashboard() {
 *   const { profile, isLoading } = useMSPEmployeeOnly();
 *   if (isLoading) return <div>Loading...</div>;
 *   // Rest of component - only MSP employees will reach here
 * }
 * ```
 */
export const useMSPEmployeeOnly = () => {
  const navigate = useNavigate();
  const access = useUserAccess({ requireAuth: true });

  useEffect(() => {
    if (!access.isLoading && access.isClientUser) {
      toast.error('Access denied: This page is for MSP staff only');
      navigate('/client-portal');
    }
  }, [access.isLoading, access.isClientUser, navigate]);

  return access;
};

/**
 * Hook to enforce admin-only access
 * Redirects non-admin users away
 *
 * Usage:
 * ```tsx
 * export default function AdminSettings() {
 *   const { profile, isLoading } = useAdminOnly();
 *   if (isLoading) return <div>Loading...</div>;
 *   // Only admin MSP employees will reach here
 * }
 * ```
 */
export const useAdminOnly = () => {
  const navigate = useNavigate();
  const access = useUserAccess({ requireAuth: true });

  useEffect(() => {
    if (!access.isLoading) {
      if (access.isClientUser) {
        toast.error('Access denied: This page is for MSP staff only');
        navigate('/client-portal');
      } else if (!access.canAccessAdminPortal) {
        toast.error('Access denied: Admin privileges required');
        navigate('/portal');
      }
    }
  }, [access.isLoading, access.isClientUser, access.canAccessAdminPortal, navigate]);

  return access;
};

/**
 * Hook to warn MSP employees accessing client portal
 * Allows access but shows a warning toast
 *
 * Usage:
 * ```tsx
 * export default function ClientPortal() {
 *   const { profile, isLoading } = useClientPortalAccess();
 *   // Both client users and MSP employees can access
 * }
 * ```
 */
export const useClientPortalAccess = () => {
  const access = useUserAccess({ requireAuth: true });

  useEffect(() => {
    if (!access.isLoading && access.isMSPEmployee) {
      // Optional: Show info toast to MSP employees
      console.info('MSP employee accessing client portal (support mode)');
    }
  }, [access.isLoading, access.isMSPEmployee]);

  return access;
};
