import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDemoMode } from "./useDemoMode";

export type Customer = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  status: string;
  plan_type: string;
  created_at: string;
};

export function useAdminData() {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userCustomerId, setUserCustomerId] = useState<string>("00000000-0000-0000-0000-000000000000");

  const fetchCustomers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load customers");
      console.error(error);
    } else {
      setCustomers(data || []);
    }
    setIsLoading(false);
  };

  const checkAdminAccess = async () => {
    if (isPreviewMode) {
      setIsAdmin(true);
      // In preview mode, try to get a real customer ID from the database
      const { data: customers } = await supabase
        .from("customers")
        .select("id")
        .limit(1)
        .maybeSingle();
      
      if (customers?.id) {
        setUserCustomerId(customers.id);
      } else {
        // Generate a valid UUID for preview mode if no customers exist
        setUserCustomerId("00000000-0000-0000-0000-000000000000");
      }
      fetchCustomers();
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", session.user.id);

    let hasAdmin = roles?.some((ur: any) => ur.roles?.name === 'Super Admin' || ur.roles?.name === 'Admin');

    if (!hasAdmin) {
      const { data: rpcHasAdmin } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });
      hasAdmin = !!rpcHasAdmin;
    }

    if (!hasAdmin) {
      toast.error("Access denied: Admin privileges required");
      navigate("/");
      return;
    }

    // Get user's customer_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("customer_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile?.customer_id) {
      setUserCustomerId(profile.customer_id);
    }

    setIsAdmin(true);
    fetchCustomers();
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  return {
    isLoading,
    isAdmin,
    customers,
    userCustomerId,
    fetchCustomers,
    isPreviewMode
  };
}
