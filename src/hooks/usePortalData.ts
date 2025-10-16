import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Fetch customer data if profile has customer_id
      let customer = null;
      if (profile?.customer_id) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("*")
          .eq("id", profile.customer_id)
          .maybeSingle();
        customer = customerData;
      }

      // Fetch recent knowledge articles
      const { data: articles } = await supabase
        .from("knowledge_articles")
        .select("*")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(5);

      // Fetch recent workflow executions (only if customer_id exists)
      let workflows = [];
      if (profile?.customer_id) {
        const { data: workflowData } = await supabase
          .from("workflow_executions")
          .select("*")
          .eq("customer_id", profile.customer_id)
          .order("started_at", { ascending: false })
          .limit(5);
        workflows = workflowData || [];
      }

      setData({
        profile: profile || null,
        customer,
        recentArticles: articles || [],
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('customer_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profile?.customer_id) {
            setCustomerId(profile.customer_id);
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
