import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface Customer {
  id: string;
  company_name: string;
}

export function useProfileSettings() {
  const { profile, refresh } = useAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch all customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, company_name")
        .order("company_name");
      
      if (error) throw error;
      return data;
    },
  });

  const currentCustomer = customers?.find(c => c.id === profile?.customer_id);

  const updateCustomerAssociation = async () => {
    if (!selectedCustomerId || !profile?.user_id) {
      toast.error("Please select a customer");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ customer_id: selectedCustomerId })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      toast.success("Customer association updated successfully");
      await refresh();
      setSelectedCustomerId(""); // Reset selection
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error(error.message || "Failed to update customer association");
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile,
    customers,
    currentCustomer,
    selectedCustomerId,
    setSelectedCustomerId,
    isLoadingCustomers,
    isUpdating,
    updateCustomerAssociation,
  };
}
