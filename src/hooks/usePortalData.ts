import { useState, useEffect } from "react";
import { PortalService } from "@/services/portalService";
import { AuthService } from "@/services/authService";

interface PortalData {
  profile: any;
  customer: any;
  recentArticles: any[];
  recentWorkflows: any[];
}

/**
 * Centralized hook for fetching all Portal data
 * Eliminates duplicate data fetching patterns across components
 */
export const usePortalData = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData>({
    profile: null,
    customer: null,
    recentArticles: [],
    recentWorkflows: [],
  });

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      
      // Fetch session
      const session = await AuthService.getSession();
      if (!session) return;

      // Fetch user profile
      const profile = await AuthService.getUserProfile(session.user.id);

      // Fetch customer data if profile has customer_id
      let customer = null;
      if (profile?.customer_id) {
        const customerResponse = await PortalService.getCustomer(profile.customer_id);
        customer = customerResponse.data;
      }

      // Fetch recent knowledge articles
      const articlesResponse = await PortalService.getRecentArticles();
      const articles = articlesResponse.data || [];

      // Fetch recent workflow executions (only if customer_id exists)
      let workflows: any[] = [];
      if (profile?.customer_id) {
        const workflowsResponse = await PortalService.getRecentWorkflows(profile.customer_id);
        workflows = workflowsResponse.data || [];
      }

      setData({
        profile: profile || null,
        customer,
        recentArticles: articles,
        recentWorkflows: workflows,
      });
    } catch (error) {
      console.error("Error loading portal data:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    profile: data.profile,
    customer: data.customer,
    recentArticles: data.recentArticles,
    recentWorkflows: data.recentWorkflows,
    reload: loadPortalData,
  };
};

/**
 * Simplified hook for just fetching user's customer ID
 * Useful for components that only need the customer context
 */
export const useCustomerId = () => {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerId = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          const customerId = await AuthService.getCustomerId(user.id);
          if (customerId) {
            setCustomerId(customerId);
          }
        }
      } catch (error) {
        console.error("Error fetching customer ID:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerId();
  }, []);

  return { customerId, loading };
};
