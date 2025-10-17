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
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    customerId: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });
  const navigate = useNavigate();
  const notify = useNotification();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Defer Supabase calls to avoid async work inside the callback (prevents deadlocks)
        setTimeout(() => {
          loadProfile(session.user.id);
        }, 0);
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          profile: null,
          customerId: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      }
    });

    // After subscribing, check for existing session
    loadAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setState({
          user: null,
          profile: null,
          customerId: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
        return;
      }

      await loadProfile(session.user.id);
    } catch (error) {
      console.error("Error loading auth:", error);
      setState({
        user: null,
        profile: null,
        customerId: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
        throw error;
      }

      const { data: userData } = await supabase.auth.getUser();

      // Check admin role - try direct query first
      let isAdmin = false;
      console.log("Checking admin role for user:", userId);
      
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", userId);
      
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      } else {
        console.log("User roles from direct query:", roles);
        isAdmin = roles?.some((ur: any) => 
          ur.roles?.name === 'Super Admin' || ur.roles?.name === 'Admin'
        ) || false;
      }

      // Fallback to RPC if direct query failed or returned false
      if (!isAdmin) {
        console.log("Trying RPC has_role fallback...");
        const { data: rpcHasAdmin, error: rpcError } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin'
        });
        
        if (rpcError) {
          console.error("Error in has_role RPC:", rpcError);
        } else {
          console.log("RPC has_role result:", rpcHasAdmin);
          isAdmin = !!rpcHasAdmin;
        }
      }

      console.log("Final isAdmin value:", isAdmin);

      setState({
        user: userData.user,
        profile: profile as UserProfile | null,
        customerId: profile?.customer_id || null,
        isLoading: false,
        isAuthenticated: true,
        isAdmin,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      setState({
        user: null,
        profile: null,
        customerId: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
    }
  };

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

  return {
    ...state,
    requireAuth,
    requireCustomer,
    signOut,
    refresh: loadAuth,
  };
}
