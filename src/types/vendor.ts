/**
 * Shared vendor types for documentation management
 */

export interface Vendor {
  id: string;
  customer_id: string;
  vendor_name: string;
  vendor_code?: string;
  vendor_type: VendorType;
  website?: string | null;
  documentation_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  status: VendorStatus;
  api_key_instructions?: any;
  created_at: string;
  created_by: string;
  updated_at?: string;
}

export type VendorType = 
  | 'firewall' 
  | 'network' 
  | 'security' 
  | 'software' 
  | 'cloud' 
  | 'hardware'
  | 'supplier'
  | 'service_provider'
  | 'manufacturer'
  | 'distributor'
  | 'other';

export type VendorStatus = 'active' | 'inactive';

export interface CreateVendorInput {
  vendor_name: string;
  vendor_type: VendorType;
  website?: string;
  documentation_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  payment_terms?: string;
  notes?: string;
}

export interface UpdateVendorInput extends Partial<CreateVendorInput> {
  id: string;
}
