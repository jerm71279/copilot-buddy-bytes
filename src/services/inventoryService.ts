import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { BaseService } from "./baseService";

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update'];

type WarehouseLocation = Database['public']['Tables']['warehouse_locations']['Row'];
type WarehouseLocationInsert = Database['public']['Tables']['warehouse_locations']['Insert'];
type WarehouseLocationUpdate = Database['public']['Tables']['warehouse_locations']['Update'];

/**
 * Inventory Item Service
 */
export class InventoryItemService extends BaseService {
  static async getItemsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as InventoryItem[];
  }

  static async createItem(input: InventoryItemInsert) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create inventory item');
    return data as InventoryItem;
  }

  static async updateItem(id: string, updates: InventoryItemUpdate) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Inventory item not found');
    return data as InventoryItem;
  }

  static async deleteItem(id: string) {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

/**
 * Warehouse Service
 */
export class WarehouseService extends BaseService {
  static async getWarehousesByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('warehouse_locations')
      .select('*')
      .eq('customer_id', customerId)
      .order('location_name', { ascending: true });

    if (error) throw error;
    return data as WarehouseLocation[];
  }

  static async createWarehouse(input: WarehouseLocationInsert) {
    const { data, error } = await supabase
      .from('warehouse_locations')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create warehouse location');
    return data as WarehouseLocation;
  }

  static async updateWarehouse(id: string, updates: WarehouseLocationUpdate) {
    const { data, error } = await supabase
      .from('warehouse_locations')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Warehouse location not found');
    return data as WarehouseLocation;
  }

  static async deleteWarehouse(id: string) {
    const { error } = await supabase
      .from('warehouse_locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
