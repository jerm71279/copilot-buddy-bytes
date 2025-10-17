import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { ProfileInfoDisplay } from "@/components/profile/ProfileInfoDisplay";
import { CustomerAssociationForm } from "@/components/profile/CustomerAssociationForm";

export default function ProfileSettings() {
  const {
    profile,
    customers,
    currentCustomer,
    selectedCustomerId,
    setSelectedCustomerId,
    isLoadingCustomers,
    isUpdating,
    updateCustomerAssociation,
  } = useProfileSettings();

  if (isLoadingCustomers) {
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
          <ProfileInfoDisplay 
            fullName={profile?.full_name}
            currentCustomerName={currentCustomer?.company_name}
          />

          <CustomerAssociationForm
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onCustomerSelect={setSelectedCustomerId}
            onSubmit={updateCustomerAssociation}
            isUpdating={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  );
}
