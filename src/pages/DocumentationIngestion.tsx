import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useVendors } from "@/hooks/useVendors";
import { AddVendorDialog } from "@/components/documentation/AddVendorDialog";
import { validateUrl } from "@/utils/validation";
import { CreateVendorInput } from "@/types/vendor";

export default function DocumentationIngestion() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("technical_documentation");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Custom hooks for auth and vendor management
  const { user, customerId, isLoading: authLoading, error: authError } = useCustomerAuth();
  const { 
    vendors, 
    loading: vendorsLoading, 
    selectedVendorId, 
    selectedVendor,
    setSelectedVendorId,
    createVendor 
  } = useVendors(customerId || undefined);

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor?.documentation_url) {
      setUrl(vendor.documentation_url);
    }
  };

  const handleAddVendor = async (input: CreateVendorInput) => {
    if (!customerId || !user) {
      throw new Error('Authentication required');
    }
    await createVendor(input, customerId, user.id);
  };

  const handleIngest = async () => {
    // Validate inputs
    if (!customerId) {
      toast({
        title: "Authentication required",
        description: authError || "Please ensure your account is properly set up",
        variant: "destructive",
      });
      return;
    }

    if (!url || !selectedVendorId) {
      toast({
        title: "Missing information",
        description: "Please provide both a vendor and documentation URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      toast({
        title: "Invalid URL",
        description: urlValidation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ingest-documentation', {
        body: {
          url: urlValidation.sanitized,
          source: selectedVendor?.vendor_name || 'Unknown',
          category,
          customerId,
          vendorId: selectedVendorId
        }
      });

      if (error) throw error;

      toast({
        title: "Documentation ingested",
        description: `Successfully added: ${data.title}`,
      });

      setUrl("");
      setCategory("technical_documentation");
    } catch (error) {
      console.error('Error ingesting documentation:', error);
      toast({
        title: "Ingestion failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || vendorsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <DashboardNavigation />
        <main className="container mx-auto p-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  // Show auth error
  if (authError && !customerId) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <DashboardNavigation />
        <main className="container mx-auto p-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <DashboardNavigation />
      <main className="container mx-auto p-8 space-y-6" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Documentation Ingestion</CardTitle>
            <CardDescription>
              Ingest external vendor documentation into the AI knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vendor Selection */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="vendor">Vendor</Label>
                <Select value={selectedVendorId} onValueChange={handleVendorChange}>
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendor_name} ({vendor.vendor_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AddVendorDialog 
                onVendorAdded={handleAddVendor} 
                disabled={!customerId || !user}
              />
            </div>

            {/* Documentation URL */}
            <div>
              <Label htmlFor="url">Documentation URL *</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.example.com/..."
                maxLength={2000}
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="technical_documentation"
                maxLength={100}
              />
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleIngest} 
              disabled={loading || !url || !selectedVendorId || !customerId}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingest Documentation
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
