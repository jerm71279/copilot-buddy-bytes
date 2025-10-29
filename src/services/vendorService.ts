import { supabase } from "@/integrations/supabase/client";

// Temporary types until database types regenerate
type Vendor = any;
type VendorInsert = any;
type VendorUpdate = any;
type VendorContract = any;
type VendorContractInsert = any;
type VendorPerformance = any;

/**
 * Vendor Service
 */
export class VendorService {
  static async getVendorsByCustomer(customerId: string) {
    const { data, error } = await (supabase as any)
      .from('vendors')
      .select('*')
      .eq('customer_id', customerId)
      .order('vendor_name', { ascending: true });

    if (error) throw error;
    return data as Vendor[];
  }

  static async getActiveVendors(customerId: string) {
    const { data, error } = await (supabase as any)
      .from('vendors')
      .select('*')
      .eq('customer_id', customerId)
      .eq('vendor_status', 'active')
      .order('vendor_name', { ascending: true });

    if (error) throw error;
    return data as Vendor[];
  }

  static async getVendorById(id: string) {
    const { data, error } = await (supabase as any)
      .from('vendors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Vendor | null;
  }

  static async createVendor(input: Partial<VendorInsert>, customerId: string, userId: string) {
    const { data, error } = await (supabase as any)
      .from('vendors')
      .insert([{ ...input, customer_id: customerId, created_by: userId }])
      .select()
      .single();

    if (error) throw error;
    return data as Vendor;
  }

  static async updateVendor(id: string, updates: VendorUpdate) {
    const { data, error } = await (supabase as any)
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Vendor;
  }

  static async deleteVendor(id: string) {
    const { error } = await (supabase as any)
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async getContractsByVendor(vendorId: string, customerId: string) {
    const { data, error } = await (supabase as any)
      .from('vendor_contracts')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('customer_id', customerId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data as VendorContract[];
  }

  static async createContract(input: VendorContractInsert) {
    const { data, error } = await (supabase as any)
      .from('vendor_contracts')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data as VendorContract;
  }

  static async getPerformanceByVendor(vendorId: string, customerId: string) {
    const { data, error } = await (supabase as any)
      .from('vendor_performance')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('customer_id', customerId)
      .order('evaluation_date', { ascending: false });

    if (error) throw error;
    return data as VendorPerformance[];
  }
}
