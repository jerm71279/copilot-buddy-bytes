/**
 * useUserProfile Hook
 * Centralized hook for fetching user profile and customer_id
 * Replaces 15+ duplicate fetchUserProfile functions across pages
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/authService";

interface UserProfile {
  user_id: string;
  customer_id: string | null;
  full_name?: string;
  email?: string;
  department?: string;
  role?: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  customerId: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserProfile(requireAuth = true): UseUserProfileReturn {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = await AuthService.getCurrentUser();
      
      if (!user) {
        if (requireAuth) {
          navigate("/auth");
        }
        return;
      }

      const userProfile = await AuthService.getUserProfile(user.id);

      setProfile(userProfile);
      setCustomerId(userProfile?.customer_id || null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch profile"));
      console.error("Error fetching user profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    customerId,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
