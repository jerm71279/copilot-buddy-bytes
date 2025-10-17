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
import { useToast } from "@/hooks/use-toast";
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";

interface Vendor {
  id: string;
  vendor_name: string;
  vendor_type: string;
  website_url?: string;
  documentation_url?: string;
  support_email?: string;
  support_phone?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export default function VendorDocumentation() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    vendor_name: "",
    vendor_type: "firewall",
    website_url: "",
    documentation_url: "",
    support_email: "",
    support_phone: "",
    notes: ""
  });
  const { toast } = useToast();

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

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.customer_id) {
        toast({
          title: "Error",
          description: "Cannot save vendor without organization",
          variant: "destructive",
        });
        return;
      }

      if (editingVendor) {
        const { error } = await supabase
          .from('documentation_vendors')
          .update(formData)
          .eq('id', editingVendor.id);

        if (error) throw error;

        toast({
          title: "Vendor updated",
          description: "Vendor information has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('documentation_vendors')
          .insert({
            ...formData,
            customer_id: profile.customer_id,
            created_by: user.id,
            is_active: true
          } as any);

        if (error) throw error;

        toast({
          title: "Vendor added",
          description: "New vendor has been added successfully",
        });
      }

      setShowDialog(false);
      setEditingVendor(null);
      setFormData({
        vendor_name: "",
        vendor_type: "firewall",
        website_url: "",
        documentation_url: "",
        support_email: "",
        support_phone: "",
        notes: ""
      });
      loadVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendor_name: vendor.vendor_name,
      vendor_type: vendor.vendor_type,
      website_url: vendor.website_url || "",
      documentation_url: vendor.documentation_url || "",
      support_email: vendor.support_email || "",
      support_phone: vendor.support_phone || "",
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

      toast({
        title: "Vendor deleted",
        description: "Vendor has been removed successfully",
      });

      loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <DashboardNavigation />
      <main className="container mx-auto p-8 space-y-6">
        <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Vendor Documentation Management</CardTitle>
              <CardDescription>
                Manage vendors and their documentation sources
              </CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingVendor(null);
                  setFormData({
                    vendor_name: "",
                    vendor_type: "firewall",
                    website_url: "",
                    documentation_url: "",
                    support_email: "",
                    support_phone: "",
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
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({...formData, website_url: e.target.value})}
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
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      value={formData.support_email}
                      onChange={(e) => setFormData({...formData, support_email: e.target.value})}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="support_phone">Support Phone</Label>
                    <Input
                      id="support_phone"
                      value={formData.support_phone}
                      onChange={(e) => setFormData({...formData, support_phone: e.target.value})}
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
                    {vendor.website_url && (
                      <a href={vendor.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
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
                    {vendor.support_email && <div>{vendor.support_email}</div>}
                    {vendor.support_phone && <div className="text-muted-foreground">{vendor.support_phone}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.is_active ? "default" : "secondary"}>
                      {vendor.is_active ? "Active" : "Inactive"}
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
      </main>
    </div>
  );
}
