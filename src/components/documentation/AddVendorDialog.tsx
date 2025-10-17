import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { VendorType, CreateVendorInput } from '@/types/vendor';
import { validateVendorName, validateUrl, validateEmail } from '@/utils/validation';

interface AddVendorDialogProps {
  onVendorAdded: (input: CreateVendorInput) => Promise<void>;
  disabled?: boolean;
}

const VENDOR_TYPES: { value: VendorType; label: string }[] = [
  { value: 'firewall', label: 'Firewall' },
  { value: 'network', label: 'Network' },
  { value: 'security', label: 'Security' },
  { value: 'software', label: 'Software' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'other', label: 'Other' },
];

export function AddVendorDialog({ onVendorAdded, disabled }: AddVendorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateVendorInput>({
    vendor_name: '',
    vendor_type: 'software',
    website: '',
    documentation_url: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      vendor_name: '',
      vendor_type: 'software',
      website: '',
      documentation_url: '',
      contact_email: '',
      contact_phone: '',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate vendor name
      const nameValidation = validateVendorName(formData.vendor_name);
      if (!nameValidation.valid) {
        toast({
          title: 'Validation error',
          description: nameValidation.error,
          variant: 'destructive',
        });
        return;
      }

      // Validate website URL if provided
      if (formData.website) {
        const urlValidation = validateUrl(formData.website);
        if (!urlValidation.valid) {
          toast({
            title: 'Validation error',
            description: `Website: ${urlValidation.error}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Validate documentation URL if provided
      if (formData.documentation_url) {
        const docUrlValidation = validateUrl(formData.documentation_url);
        if (!docUrlValidation.valid) {
          toast({
            title: 'Validation error',
            description: `Documentation URL: ${docUrlValidation.error}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Validate email if provided
      if (formData.contact_email) {
        const emailValidation = validateEmail(formData.contact_email);
        if (!emailValidation.valid) {
          toast({
            title: 'Validation error',
            description: emailValidation.error,
            variant: 'destructive',
          });
          return;
        }
      }

      await onVendorAdded(formData);

      toast({
        title: 'Vendor added',
        description: `${formData.vendor_name} has been added successfully`,
      });

      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: 'Failed to add vendor',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-7" disabled={disabled}>
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
              value={formData.vendor_name}
              onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
              placeholder="e.g., Cisco, Fortinet"
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="vendorType">Type *</Label>
            <Select
              value={formData.vendor_type}
              onValueChange={(value: VendorType) => setFormData({ ...formData, vendor_type: value })}
            >
              <SelectTrigger id="vendorType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vendorWebsite">Website URL</Label>
            <Input
              id="vendorWebsite"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              maxLength={2000}
            />
          </div>
          <div>
            <Label htmlFor="vendorDocs">Documentation URL</Label>
            <Input
              id="vendorDocs"
              value={formData.documentation_url}
              onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
              placeholder="https://docs.example.com"
              maxLength={2000}
            />
          </div>
          <div>
            <Label htmlFor="vendorEmail">Support Email</Label>
            <Input
              id="vendorEmail"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="support@example.com"
              maxLength={255}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || !formData.vendor_name}>
            {loading ? 'Adding...' : 'Add Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
