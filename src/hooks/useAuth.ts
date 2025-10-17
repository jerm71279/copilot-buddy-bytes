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
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    const { data: userData } = await supabase.auth.getUser();

    // Admin check
    let isAdmin = false;
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
    setGlobalState({ ...globalAuthState, isLoading: false });
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

