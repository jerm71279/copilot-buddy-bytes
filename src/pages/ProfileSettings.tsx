import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProfileSettings() {
  const { profile, refresh } = useAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch all customers
  const { data: customers, isLoading } = useQuery({
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

  const handleUpdateCustomer = async () => {
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
      await refresh(); // Reload auth to get updated profile
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error(error.message || "Failed to update customer association");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your customer association and profile settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <div className="text-sm text-muted-foreground">{profile?.full_name || "Not set"}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Customer</label>
            <div className="text-sm text-muted-foreground">
              {customers?.find(c => c.id === profile?.customer_id)?.company_name || "Not assigned"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Change Customer Association</label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleUpdateCustomer} 
            disabled={!selectedCustomerId || isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Customer Association"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
