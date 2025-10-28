import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./useNotification";

/**
 * Centralized Authentication Hook
 * Eliminates repeated auth checks across components
 * 
 * SECURITY: All authentication is server-side validated via Supabase Auth
 */

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  department: string | null;
  customer_id: string | null;
  email?: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  customerId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  return useAuthSingleton();
}

// ---------------- Singleton Auth Store (prevents duplicate subscriptions) ----------------

let authInitialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;

const initialAuthState: AuthState = {
  user: null,
  profile: null,
  customerId: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
};

let globalAuthState: AuthState = initialAuthState;
const listeners = new Set<(s: AuthState) => void>();

const broadcast = () => {
  for (const l of listeners) l(globalAuthState);
};

const setGlobalState = (next: AuthState) => {
  globalAuthState = next;
  broadcast();
};

const loadProfileGlobal = async (userId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Don't throw on profile error - user might not have profile yet
    if (profileError) {
      console.warn("Profile not found, using minimal auth state:", profileError);
    }

    // Admin check with fallback
    let isAdmin = false;
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", userId);

      isAdmin = roles?.some((ur: any) => ur.roles?.name === "Super Admin" || ur.roles?.name === "Admin") || false;

      if (!isAdmin) {
        const { data: rpcHasAdmin } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });
        isAdmin = !!rpcHasAdmin;
      }
    } catch (roleError) {
      console.warn("Could not check admin status:", roleError);
    }

    setGlobalState({
      user: userData.user,
      profile: (profile as UserProfile) || null,
      customerId: profile?.customer_id || null,
      isLoading: false,
      isAuthenticated: true,
      isAdmin,
    });
  } catch (e) {
    console.error("Error loading profile:", e);
    // Still mark as authenticated if we have a session, even if profile loading failed
    const isStillAuthenticated = globalAuthState.user !== null;
    setGlobalState({ 
      ...globalAuthState, 
      isLoading: false,
      isAuthenticated: isStillAuthenticated,
    });
  }
};

const initAuthOnce = async () => {
  if (authInitialized) return;
  authInitialized = true;

  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      setTimeout(() => {
        loadProfileGlobal(session.user.id);
      }, 0);
    } else if (event === "SIGNED_OUT") {
      setGlobalState({ ...initialAuthState, isLoading: false });
    }
  });

  authSubscription = listener.subscription;

  // Bootstrap existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    setGlobalState({ ...initialAuthState, isLoading: false });
  } else {
    await loadProfileGlobal(session.user.id);
  }
};

function useAuthSingleton() {
  const [state, setState] = useState<AuthState>(globalAuthState);
  const navigate = useNavigate();
  const notify = useNotification();

  useEffect(() => {
    // Subscribe to global store
    const listener = (s: AuthState) => setState(s);
    listeners.add(listener);
    // Initialize once
    if (!authInitialized) {
      initAuthOnce();
    } else {
      // Sync immediate
      setState(globalAuthState);
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const requireAuth = (redirectTo: string = "/auth") => {
    if (!state.isAuthenticated && !state.isLoading) {
      notify.warning("Please log in to continue");
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  const requireCustomer = () => {
    if (!state.customerId && !state.isLoading) {
      notify.error("Please assign a customer to your profile first");
      return false;
    }
    return true;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      notify.success("Signed out successfully");
    } catch (error) {
      notify.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setGlobalState({ ...initialAuthState, isLoading: false });
    } else {
      await loadProfileGlobal(session.user.id);
    }
  };

  return { ...state, requireAuth, requireCustomer, signOut, refresh };
}

/**
 * useRequireAuth Hook
 * Consolidates duplicate auth-check-and-load patterns across the codebase
 * 
 * ELIMINATES: 6 duplicate auth functions in various components
 * 
 * Usage:
 * const { checkSession, checkSessionAndLoad } = useRequireAuth();
 * 
 * useEffect(() => {
 *   checkSessionAndLoad(loadMyData);
 * }, []);
 */
export function useRequireAuth() {
  const navigate = useNavigate();
  
  /**
   * Check for valid session, redirect to auth if none found
   * @returns session object or null
   */
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return null;
    }
    return session;
  };
  
  /**
   * Check session AND execute a data loading function
   * @param loadDataFn - async function to call after auth check passes
   */
  const checkSessionAndLoad = async (loadDataFn: () => Promise<void>) => {
    const session = await checkSession();
    if (session) {
      await loadDataFn();
    }
  };

  /**
   * Get customer_id from user profile with auth check
   * @returns customer_id or null
   */
  const getCustomerId = async () => {
    const session = await checkSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    return profile?.customer_id || null;
  };

  return { 
    checkSession, 
    checkSessionAndLoad,
    getCustomerId 
  };
}
