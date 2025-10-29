import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDemoMode } from "./useDemoMode";
import { AdminService, Customer } from "@/services/adminService";

export type { Customer };

export function useAdminData() {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userCustomerId, setUserCustomerId] = useState<string>("00000000-0000-0000-0000-000000000000");

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers");
      console.error(error);
    }
    setIsLoading(false);
  };

  const checkAdminAccess = async () => {
    if (isPreviewMode) {
      setIsAdmin(true);
      const customerId = await AdminService.getFirstCustomerId();
      setUserCustomerId(customerId || "00000000-0000-0000-0000-000000000000");
      fetchCustomers();
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const hasAdmin = await AdminService.checkAdminRole(session.user.id);

    if (!hasAdmin) {
      toast.error("Access denied: Admin privileges required");
      navigate("/");
      return;
    }

    const customerId = await AdminService.getUserCustomerId(session.user.id);
    if (customerId) {
      setUserCustomerId(customerId);
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
