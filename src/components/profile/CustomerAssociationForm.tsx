import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  company_name: string;
}

interface CustomerAssociationFormProps {
  customers?: Customer[];
  selectedCustomerId: string;
  onCustomerSelect: (customerId: string) => void;
  onSubmit: () => void;
  isUpdating: boolean;
}

export function CustomerAssociationForm({
  customers,
  selectedCustomerId,
  onCustomerSelect,
  onSubmit,
  isUpdating,
}: CustomerAssociationFormProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Change Customer Association</label>
        <Select value={selectedCustomerId} onValueChange={onCustomerSelect}>
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
        onClick={onSubmit} 
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
    </>
  );
}
