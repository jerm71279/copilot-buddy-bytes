import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStandardToast } from "@/hooks/useStandardToast";
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

import { useAuthFunctions } from "@/hooks/useAuthFunctions";

interface Vendor {
  id: string;
  vendor_name: string;
  vendor_type: string;
  website?: string;
  documentation_url?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  status?: string;
  created_at: string;
}

export default function VendorDocumentation() {
  const { signupComplete } = useAuthFunctions();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
const [formData, setFormData] = useState({
  vendor_name: "",
  vendor_type: "firewall",
  website: "",
  documentation_url: "",
  contact_email: "",
  contact_phone: "",
  notes: ""
});
  const toast = useStandardToast();

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    const { data } = await supabase
      .from('documentation_vendors')
      .select('*')
      .order('vendor_name');
    
    if (data) {
      setVendors(data as any);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get user's customer
      let { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no customer linked yet, attempt to complete signup
      if (!profile?.customer_id) {
        const fullName = (user.user_metadata?.full_name as string | undefined) || (user.email ?? 'User');
        const data = await signupComplete.invoke({
          userId: user.id,
          email: user.email || '',
          fullName
        });
        
        if (!data) {
          toast.error("We couldn't auto-complete your profile. Please contact an admin.");
          return;
        }
        
        const refreshed = await supabase
          .from('user_profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();
        profile = refreshed.data ?? null;

        if (!profile?.customer_id) {
          toast.error("Your account is missing an organization link.");
          return;
        }
      }

      if (editingVendor) {
        const payload = {
          vendor_name: formData.vendor_name,
          vendor_type: formData.vendor_type,
          website: formData.website || null,
          documentation_url: formData.documentation_url || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          notes: formData.notes || null,
        };
        const { error } = await supabase
          .from('documentation_vendors')
          .update(payload)
          .eq('id', editingVendor.id);

        if (error) throw error;

        toast.success("Vendor information has been updated successfully");
      } else {
        const insertPayload = {
          vendor_name: formData.vendor_name,
          vendor_type: formData.vendor_type,
          website: formData.website || null,
          documentation_url: formData.documentation_url || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          notes: formData.notes || null,
          customer_id: profile.customer_id,
          created_by: user.id,
          status: 'active'
        };
        const { error } = await supabase
          .from('documentation_vendors')
          .insert(insertPayload as any);

        if (error) throw error;

        toast.success("New vendor has been added successfully");
      }

      setShowDialog(false);
      setEditingVendor(null);
setFormData({
  vendor_name: "",
  vendor_type: "firewall",
  website: "",
  documentation_url: "",
  contact_email: "",
  contact_phone: "",
  notes: ""
});
      loadVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error(error.message || "Failed to save vendor");
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
setFormData({
  vendor_name: vendor.vendor_name,
  vendor_type: vendor.vendor_type,
  website: vendor.website || "",
  documentation_url: vendor.documentation_url || "",
  contact_email: vendor.contact_email || "",
  contact_phone: vendor.contact_phone || "",
  notes: vendor.notes || ""
});
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const { error } = await supabase
        .from('documentation_vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Vendor has been removed successfully");

      loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error(error.message || "Failed to delete vendor");
    }
  };

  return (
    <DashboardLayout>
      
      <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Vendor Documentation Management</h1>
            <p className="text-muted-foreground">Manage vendors and their documentation sources</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingVendor(null);
setFormData({
  vendor_name: "",
  vendor_type: "firewall",
  website: "",
  documentation_url: "",
  contact_email: "",
  contact_phone: "",
  notes: ""
});
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingVendor ? 'Edit' : 'Add'} Vendor</DialogTitle>
                <DialogDescription>
                  {editingVendor ? 'Update' : 'Create'} vendor information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <Label htmlFor="vendor_name">Vendor Name *</Label>
                  <Input
                    id="vendor_name"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_type">Type *</Label>
                  <Select value={formData.vendor_type} onValueChange={(value) => setFormData({...formData, vendor_type: value})}>
                    <SelectTrigger>
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
                <div className="col-span-2">
<Label htmlFor="website">Website URL</Label>
<Input
  id="website"
  value={formData.website}
  onChange={(e) => setFormData({...formData, website: e.target.value})}
  placeholder="https://example.com"
/>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="documentation_url">Documentation URL</Label>
                  <Input
                    id="documentation_url"
                    value={formData.documentation_url}
                    onChange={(e) => setFormData({...formData, documentation_url: e.target.value})}
                    placeholder="https://docs.example.com"
                  />
                </div>
                <div>
<Label htmlFor="contact_email">Support Email</Label>
<Input
  id="contact_email"
  value={formData.contact_email}
  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
  placeholder="support@example.com"
/>
                </div>
                <div>
<Label htmlFor="contact_phone">Support Phone</Label>
<Input
  id="contact_phone"
  value={formData.contact_phone}
  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
  placeholder="+1 (555) 123-4567"
/>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave} disabled={!formData.vendor_name}>
                  {editingVendor ? 'Update' : 'Create'} Vendor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
        <CardHeader>
          <CardTitle>Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Documentation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{vendor.vendor_type}</Badge>
                  </TableCell>
                  <TableCell>
{vendor.website && (
  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
    <ExternalLink className="h-3 w-3" />
    Visit
  </a>
)}
                  </TableCell>
                  <TableCell>
                    {vendor.documentation_url && (
                      <a href={vendor.documentation_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        Docs
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
{vendor.contact_email && <div>{vendor.contact_email}</div>}
{vendor.contact_phone && <div className="text-muted-foreground">{vendor.contact_phone}</div>}
                  </TableCell>
                  <TableCell>
<Badge variant={vendor.status === 'active' ? "default" : "secondary"}>
  {vendor.status === 'active' ? "Active" : "Inactive"}
</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(vendor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(vendor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
