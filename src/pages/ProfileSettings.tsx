import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { ProfileInfoDisplay } from "@/components/profile/ProfileInfoDisplay";
import { CustomerAssociationForm } from "@/components/profile/CustomerAssociationForm";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
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
    </DashboardLayout>
  );
}
