import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Extended auth hook with auto-signup completion for customer ID
 * Wraps the existing useAuth hook
 */
export function useCustomerAuth() {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const attemptAutoComplete = async () => {
      // Only attempt if user is authenticated but has no customer
      if (auth.isAuthenticated && auth.user && !auth.customerId && !auth.isLoading && !isCompleting) {
        setIsCompleting(true);
        try {
          const fullName = (auth.user.user_metadata?.full_name as string) || auth.user.email || 'User';
          const emailUsername = (auth.user.email || '').split('@')[0] || 'user';
          
          const { error: completeError } = await supabase.functions.invoke('complete-user-signup', {
            body: { userId: auth.user.id, fullName, emailUsername }
          });

          if (completeError) {
            console.error('Auto-signup completion failed:', completeError);
            setError('Unable to complete profile setup. Please contact support.');
          } else {
            // Refresh auth state to pick up new customer_id
            await auth.refresh();
          }
        } catch (err) {
          console.error('Error during auto-signup completion:', err);
          setError('Profile setup error');
        } finally {
          setIsCompleting(false);
        }
      }

      if (auth.isAuthenticated && !auth.customerId && !auth.isLoading && !isCompleting) {
        setError('No organization linked to your account');
      }
    };

    attemptAutoComplete();
  }, [auth.isAuthenticated, auth.user, auth.customerId, auth.isLoading, isCompleting, auth.refresh]);

  return {
    ...auth,
    error,
    isCompleting,
  };
}
