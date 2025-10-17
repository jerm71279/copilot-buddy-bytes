import { supabase } from '@/integrations/supabase/client';
import { Vendor, CreateVendorInput, UpdateVendorInput } from '@/types/vendor';

/**
 * Service layer for vendor CRUD operations
 * Centralizes all database interactions for vendors
 */

export class VendorService {
  /**
   * Fetch all active vendors for a customer
   */
  static async getActiveVendors(customerId?: string): Promise<Vendor[]> {
    let query = supabase
      .from('documentation_vendors')
      .select('*')
      .eq('status', 'active')
      .order('vendor_name');

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching vendors:', error);
      throw new Error(`Failed to fetch vendors: ${error.message}`);
    }

    return (data || []) as Vendor[];
  }

  static async createVendor(
    input: CreateVendorInput,
    customerId: string,
    userId: string
  ): Promise<Vendor> {
    const insertData: any = {
      customer_id: customerId,
      vendor_name: input.vendor_name,
      vendor_type: input.vendor_type,
      website: input.website || null,
      documentation_url: input.documentation_url || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      notes: input.notes || null,
      status: 'active',
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('documentation_vendors')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating vendor:', error);
      throw new Error(`Failed to create vendor: ${error.message}`);
    }

    return data as Vendor;
  }

  /**
   * Update an existing vendor
   */
  static async updateVendor(input: UpdateVendorInput): Promise<Vendor> {
    const { id, ...updateData } = input;

    const { data, error } = await supabase
      .from('documentation_vendors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vendor:', error);
      throw new Error(`Failed to update vendor: ${error.message}`);
    }

    return data as Vendor;
  }

  /**
   * Delete a vendor (soft delete by setting status to inactive)
   */
  static async deleteVendor(vendorId: string): Promise<void> {
    const { error } = await supabase
      .from('documentation_vendors')
      .update({ status: 'inactive' })
      .eq('id', vendorId);

    if (error) {
      console.error('Error deleting vendor:', error);
      throw new Error(`Failed to delete vendor: ${error.message}`);
    }
  }

  /**
   * Get a single vendor by ID
   */
  static async getVendorById(vendorId: string): Promise<Vendor | null> {
    const { data, error } = await supabase
      .from('documentation_vendors')
      .select('*')
      .eq('id', vendorId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vendor:', error);
      throw new Error(`Failed to fetch vendor: ${error.message}`);
    }

    return data as Vendor | null;
  }
}
