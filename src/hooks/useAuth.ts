import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./useNotification";
import { AuthService, UserProfile } from "@/services/authService";

export type { UserProfile };

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
    const userData = await AuthService.getCurrentUser();
    const profile = await AuthService.getUserProfile(userId);
    const isAdmin = await AuthService.isUserAdmin(userId);

    setGlobalState({
      user: userData,
      profile: profile,
      customerId: profile?.customer_id || null,
      isLoading: false,
      isAuthenticated: true,
      isAdmin,
    });
  } catch (e) {
    console.error("Error loading profile:", e);
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

  const { data: listener } = AuthService.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      setTimeout(() => {
        loadProfileGlobal(session.user.id);
      }, 0);
    } else if (event === "SIGNED_OUT") {
      setGlobalState({ ...initialAuthState, isLoading: false });
    }
  });

  authSubscription = listener.subscription;

  const session = await AuthService.getSession();
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
      await AuthService.signOut();
      navigate("/auth");
      notify.success("Signed out successfully");
    } catch (error) {
      notify.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  const refresh = async () => {
    const session = await AuthService.getSession();
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
  
  const checkSession = async () => {
    const session = await AuthService.getSession();
    if (!session) {
      navigate('/auth');
      return null;
    }
    return session;
  };
  
  const checkSessionAndLoad = async (loadDataFn: () => Promise<void>) => {
    const session = await checkSession();
    if (session) {
      await loadDataFn();
    }
  };

  const getCustomerId = async () => {
    const session = await checkSession();
    if (!session) return null;

    return await AuthService.getCustomerId(session.user.id);
  };

  return { 
    checkSession, 
    checkSessionAndLoad,
    getCustomerId 
  };
}
