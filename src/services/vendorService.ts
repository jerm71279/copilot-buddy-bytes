import { BaseService, ServiceResponse } from "./baseService";
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
export class VendorService extends BaseService {
  static async getVendorsByCustomer(customerId: string): Promise<ServiceResponse<Vendor[]>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from('vendors')
        .select('*')
        .eq('customer_id', customerId)
        .order('vendor_name', { ascending: true });
    });
  }

  static async getActiveVendors(customerId: string): Promise<ServiceResponse<Vendor[]>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from('vendors')
        .select('*')
        .eq('customer_id', customerId)
        .eq('vendor_status', 'active')
        .order('vendor_name', { ascending: true });
    });
  }

  static async getVendorById(id: string): Promise<ServiceResponse<Vendor | null>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from('vendors')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    });
  }

  static async createVendor(input: Partial<VendorInsert>, customerId: string, userId: string): Promise<ServiceResponse<Vendor>> {
    return this.executeQuery(async () => {
      const { data, error } = await (supabase as any)
        .from('vendors')
        .insert([{ ...input, customer_id: customerId, created_by: userId }])
        .select()
        .maybeSingle();
      
      if (error) return { data: null, error };
      if (!data) return { data: null, error: new Error('Failed to create vendor') };
      return { data, error: null };
    });
  }

  static async updateVendor(id: string, updates: VendorUpdate): Promise<ServiceResponse<Vendor>> {
    return this.executeQuery(async () => {
      const { data, error } = await (supabase as any)
        .from('vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) return { data: null, error };
      if (!data) return { data: null, error: new Error('Vendor not found') };
      return { data, error: null };
    });
  }

  static async deleteVendor(id: string): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await (supabase as any)
        .from('vendors')
        .delete()
        .eq('id', id);
      
      return { data: null, error };
    });
  }

  static async getContractsByVendor(vendorId: string, customerId: string): Promise<ServiceResponse<VendorContract[]>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from('vendor_contracts')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('customer_id', customerId)
        .order('start_date', { ascending: false });
    });
  }

  static async createContract(input: VendorContractInsert): Promise<ServiceResponse<VendorContract>> {
    return this.executeQuery(async () => {
      const { data, error } = await (supabase as any)
        .from('vendor_contracts')
        .insert([input])
        .select()
        .maybeSingle();
      
      if (error) return { data: null, error };
      if (!data) return { data: null, error: new Error('Failed to create contract') };
      return { data, error: null };
    });
  }

  static async getPerformanceByVendor(vendorId: string, customerId: string): Promise<ServiceResponse<VendorPerformance[]>> {
    return this.executeQuery(async () => {
      return await (supabase as any)
        .from('vendor_performance')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('customer_id', customerId)
        .order('evaluation_date', { ascending: false });
    });
  }
}
