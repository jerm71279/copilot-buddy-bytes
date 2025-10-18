import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Plus, X, FileText, Settings } from "lucide-react";
import Navigation from "@/components/Navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useVendors } from "@/hooks/useVendors";
import { AddVendorDialog } from "@/components/documentation/AddVendorDialog";
import { validateUrl } from "@/utils/validation";
import { CreateVendorInput } from "@/types/vendor";

export default function DocumentationIngestion() {
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [category, setCategory] = useState("technical_documentation");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [apiInstructions, setApiInstructions] = useState<any>(null);
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
    // Clear URLs when switching vendors
    setUrls([]);
  };

  const handleAddUrl = () => {
    if (!url) {
      toast({
        title: "Missing URL",
        description: "Please enter a documentation URL",
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

    // Check for duplicates
    if (urls.includes(urlValidation.sanitized)) {
      toast({
        title: "Duplicate URL",
        description: "This URL has already been added",
        variant: "destructive",
      });
      return;
    }

    setUrls([...urls, urlValidation.sanitized]);
    setUrl("");
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrls(urls.filter(u => u !== urlToRemove));
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

    if (urls.length === 0 || !selectedVendorId) {
      toast({
        title: "Missing information",
        description: "Please provide both a vendor and at least one documentation URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const urlToIngest of urls) {
        try {
          const { data, error } = await supabase.functions.invoke('ingest-documentation', {
            body: {
              url: urlToIngest,
              source: selectedVendor?.vendor_name || 'Unknown',
              category,
              customerId,
              vendorId: selectedVendorId
            }
          });

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Error ingesting ${urlToIngest}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Documentation ingested",
          description: `Successfully added ${successCount} documentation source(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      } else {
        throw new Error('All ingestion attempts failed');
      }

      setUrls([]);
      setUrl("");
      setCategory("technical_documentation");
      setApiInstructions(null);
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

  const handleTestNinjaOne = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ninjaone', {
        body: { instanceUrl: 'https://app.ninjarmm.com' }
      });

      if (error) {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect to NinjaOne",
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Connection Successful!",
          description: `Connected to NinjaOne. Found ${data.organizationCount} organizations.`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to NinjaOne",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing NinjaOne:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while testing the connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtractInstructions = async () => {
    if (!selectedVendorId || !selectedVendor || !customerId) {
      toast({
        title: "Missing information",
        description: "Please select a vendor first",
        variant: "destructive",
      });
      return;
    }

    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-api-instructions', {
        body: {
          vendorId: selectedVendorId,
          customerId,
          vendorName: selectedVendor.vendor_name
        }
      });

      if (error) {
        const status = (error as any).status as number | undefined;
        const msg = (error as any).message as string | undefined;
        const lower = (msg || '').toLowerCase();
          if (status === 404 || lower.includes('no documentation found')) {
            if (selectedVendor.documentation_url) {
              toast({
                title: "Ingesting docs",
                description: "No docs found. Ingesting the vendor’s default URL, then retrying...",
              });

              const { error: ingestError } = await supabase.functions.invoke('ingest-documentation', {
                body: {
                  url: selectedVendor.documentation_url,
                  source: selectedVendor.vendor_name || 'Unknown',
                  category: 'technical_documentation',
                  customerId,
                  vendorId: selectedVendorId
                }
              });

              if (ingestError) {
                toast({
                  title: "Ingestion failed",
                  description: "Could not ingest the default documentation URL. Please add docs and try again.",
                  variant: "destructive",
                });
                return;
              }

              // Retry extraction after ingesting
              const { data: retryData, error: retryError } = await supabase.functions.invoke('extract-api-instructions', {
                body: {
                  vendorId: selectedVendorId,
                  customerId,
                  vendorName: selectedVendor.vendor_name
                }
              });

              if (retryError) throw retryError;

              setApiInstructions(retryData.instructions);
              toast({
                title: "Instructions extracted",
                description: `Successfully extracted API key instructions for ${retryData.vendorName}`,
              });
              return;
            } else {
              toast({
                title: "No documentation found",
                description: "Please ingest this vendor’s docs first, then try again.",
                variant: "destructive",
              });
              return;
            }
          }
        if (status === 429 || lower.includes('rate limit')) {
          toast({
            title: "Rate limited",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }
        if (status === 402 || lower.includes('payment required')) {
          toast({
            title: "AI credits required",
            description: "Please add credits to your workspace and retry.",
            variant: "destructive",
          });
          return;
        }
        throw error as any;
      }

      setApiInstructions(data.instructions);
      toast({
        title: "Instructions extracted",
        description: `Successfully extracted API key instructions for ${data.vendorName}`,
      });
    } catch (error) {
      console.error('Error extracting instructions:', error);
      const msg = (error as any)?.message || 'An error occurred';
      toast({
        title: "Extraction failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
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
            <div className="space-y-2">
              <Label htmlFor="url">Documentation URLs</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                  placeholder="https://docs.example.com/..."
                  maxLength={2000}
                />
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon"
                  onClick={handleAddUrl}
                  disabled={!url}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* URL List */}
              {urls.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label>Added URLs ({urls.length})</Label>
                  <div className="space-y-1">
                    {urls.map((addedUrl, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <span className="flex-1 text-sm truncate">{addedUrl}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUrl(addedUrl)}
                          className="h-6 w-6 shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

            {/* Submit Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleIngest} 
                disabled={loading || urls.length === 0 || !selectedVendorId || !customerId}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ingest {urls.length} Documentation Source{urls.length !== 1 ? 's' : ''}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!selectedVendorId || !customerId}>
                    <Settings className="mr-2 h-4 w-4" />
                    Tools
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {selectedVendor?.api_key_instructions && (
                    <DropdownMenuItem onClick={() => setApiInstructions(selectedVendor.api_key_instructions)}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Saved Instructions
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleExtractInstructions}
                    disabled={extracting}
                  >
                    {extracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!extracting && <FileText className="mr-2 h-4 w-4" />}
                    Extract API Instructions
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleTestNinjaOne}
                    disabled={loading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Test NinjaOne Connection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* API Instructions Display */}
        {apiInstructions && (
          <Card>
            <CardHeader>
              <CardTitle>API Key Setup Instructions</CardTitle>
              <CardDescription>
                Extracted from {selectedVendor?.vendor_name} documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiInstructions.summary && (
                <div>
                  <Label className="text-base font-semibold">Summary</Label>
                  <p className="text-sm text-muted-foreground mt-1">{apiInstructions.summary}</p>
                </div>
              )}

              {apiInstructions.location && (
                <div>
                  <Label className="text-base font-semibold">Location</Label>
                  <p className="text-sm text-muted-foreground mt-1">{apiInstructions.location}</p>
                </div>
              )}

              {apiInstructions.prerequisites?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Prerequisites</Label>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                    {apiInstructions.prerequisites.map((prereq: string, idx: number) => (
                      <li key={idx}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {apiInstructions.requiredCredentials?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Required Credentials</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {apiInstructions.requiredCredentials.map((cred: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                        {cred}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {apiInstructions.steps?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Steps</Label>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground mt-1 space-y-2">
                    {apiInstructions.steps.map((step: string, idx: number) => (
                      <li key={idx} className="pl-2">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {apiInstructions.permissions?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Required Permissions</Label>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                    {apiInstructions.permissions.map((perm: string, idx: number) => (
                      <li key={idx}>{perm}</li>
                    ))}
                  </ul>
                </div>
              )}

              {apiInstructions.securityNotes?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Security Notes</Label>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                    {apiInstructions.securityNotes.map((note: string, idx: number) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {apiInstructions.additionalInfo && (
                <div>
                  <Label className="text-base font-semibold">Additional Information</Label>
                  <p className="text-sm text-muted-foreground mt-1">{apiInstructions.additionalInfo}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
