import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";

interface Vendor {
  id: string;
  vendor_name: string;
  vendor_type: string;
  documentation_url?: string;
  website?: string;
  status?: string;
}

interface DocumentationVendor {
  id: string;
  customer_id: string;
  vendor_name: string;
  vendor_type: string;
  website_url: string | null;
  documentation_url: string | null;
  support_email: string | null;
  support_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export default function DocumentationIngestion() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("technical_documentation");
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [showNewVendor, setShowNewVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorType, setNewVendorType] = useState("firewall");
  const [newVendorWebsite, setNewVendorWebsite] = useState("");
  const [newVendorDocs, setNewVendorDocs] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    const { data } = await supabase
      .from('documentation_vendors' as any)
      .select('*')
.eq('status', 'active')
      .order('vendor_name');
    
    if (data) {
const mappedVendors: Vendor[] = data.map((v: any) => ({
  id: v.id,
  vendor_name: v.vendor_name,
  vendor_type: v.vendor_type,
  documentation_url: v.documentation_url || undefined,
  website: v.website || undefined,
  status: v.status
}));
      setVendors(mappedVendors);
      if (mappedVendors.length > 0 && !selectedVendorId) {
        setSelectedVendorId(mappedVendors[0].id);
        if (mappedVendors[0].documentation_url) {
          setUrl(mappedVendors[0].documentation_url);
        }
      }
    }
  };

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor?.documentation_url) {
      setUrl(vendor.documentation_url);
    }
  };

  const handleAddVendor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) {
        toast({
          title: "Profile setup required",
          description: "Cannot add vendor without organization",
          variant: "destructive",
        });
        return;
      }

const { data, error } = await supabase
  .from('documentation_vendors' as any)
  .insert({
    customer_id: profile.customer_id,
    vendor_name: newVendorName,
    vendor_type: newVendorType,
    website: newVendorWebsite || null,
    documentation_url: newVendorDocs || null,
    created_by: user.id,
    status: 'active'
  })
  .select()
  .single();

      if (error) throw error;

      toast({
        title: "Vendor added",
        description: `${newVendorName} has been added successfully`,
      });

      setShowNewVendor(false);
      setNewVendorName("");
      setNewVendorType("firewall");
      setNewVendorWebsite("");
      setNewVendorDocs("");
      loadVendors();
      
      if (data) {
        setSelectedVendorId((data as any).id);
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: "Failed to add vendor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleIngest = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to ingest documentation",
          variant: "destructive",
        });
        return;
      }

      // Try to get user's customer
      let { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no customer linked yet, attempt to complete signup
      if (!profile?.customer_id) {
        const fullName = (user.user_metadata?.full_name as string | undefined) || (user.email ?? 'User');
        const emailUsername = (user.email || '').split('@')[0] || 'user';
        const { error: completeError } = await supabase.functions.invoke('complete-user-signup', {
          body: { userId: user.id, fullName, emailUsername }
        });
        if (completeError) {
          toast({
            title: "Profile setup required",
            description: "We couldn't auto-complete your profile. Please contact an admin.",
            variant: "destructive",
          });
          return;
        }
        const refreshed = await supabase
          .from('user_profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();
        profile = refreshed.data ?? null;

        if (!profile?.customer_id) {
          toast({
            title: "Profile setup required",
            description: "Your account is missing an organization link.",
            variant: "destructive",
          });
          return;
        }
      }

      const vendor = vendors.find(v => v.id === selectedVendorId);
      const { data, error } = await supabase.functions.invoke('ingest-documentation', {
        body: {
          url,
          source: vendor?.vendor_name || 'Unknown',
          category,
          customerId: profile.customer_id,
          vendorId: selectedVendorId
        }
      });

      if (error) throw error;

      toast({
        title: "Documentation ingested",
        description: `Successfully added: ${data.title}`,
      });

      setUrl("");
    } catch (error) {
      console.error('Error ingesting documentation:', error);
      toast({
        title: "Ingestion failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <Dialog open={showNewVendor} onOpenChange={setShowNewVendor}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-7">
                  <Plus className="h-4 w-4 mr-2" />
                  New Vendor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Vendor</DialogTitle>
                  <DialogDescription>
                    Create a new vendor to organize documentation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="vendorName">Vendor Name *</Label>
                    <Input
                      id="vendorName"
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      placeholder="e.g., Cisco, Fortinet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendorType">Type *</Label>
                    <Select value={newVendorType} onValueChange={setNewVendorType}>
                      <SelectTrigger id="vendorType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firewall">Firewall</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="cloud">Cloud</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="vendorWebsite">Website URL</Label>
                    <Input
                      id="vendorWebsite"
                      value={newVendorWebsite}
                      onChange={(e) => setNewVendorWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendorDocs">Documentation URL</Label>
                    <Input
                      id="vendorDocs"
                      value={newVendorDocs}
                      onChange={(e) => setNewVendorDocs(e.target.value)}
                      placeholder="https://docs.example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddVendor} disabled={!newVendorName}>
                    Add Vendor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <Label htmlFor="url">Documentation URL *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.example.com/..."
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="technical_documentation"
            />
          </div>

          <Button onClick={handleIngest} disabled={loading || !url || !selectedVendorId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ingest Documentation
          </Button>
        </CardContent>
      </Card>
      </main>
    </div>
  );
}
