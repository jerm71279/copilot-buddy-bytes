import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

/**
 * Inventory Service
 * Centralizes all inventory-related database operations (items, warehouses)
 */

// Inventory Item types
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update'];
type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row'];

/**
 * Inventory Item Service
 */
export class InventoryItemService {
  static async createItem(input: InventoryItemInsert) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create inventory item: ${error.message}`);
    if (!data) throw new Error('Failed to create inventory item: No data returned');
    
    return data as InventoryItemRow;
  }

  static async updateItem(id: string, updates: InventoryItemUpdate) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update inventory item: ${error.message}`);
    if (!data) throw new Error('Inventory item not found');
    
    return data as InventoryItemRow;
  }

  static async deleteItem(id: string) {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete inventory item: ${error.message}`);
  }

  static async getItemsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('customer_id', customerId)
      .order('item_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch inventory items: ${error.message}`);
    return data as InventoryItemRow[];
  }

  static async getItemById(id: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch inventory item: ${error.message}`);
    return data as InventoryItemRow | null;
  }
}

// Warehouse types
type WarehouseInsert = Database['public']['Tables']['warehouses']['Insert'];
type WarehouseUpdate = Database['public']['Tables']['warehouses']['Update'];
type WarehouseRow = Database['public']['Tables']['warehouses']['Row'];

/**
 * Warehouse Service
 */
export class WarehouseService {
  static async createWarehouse(input: WarehouseInsert) {
    const { data, error } = await supabase
      .from('warehouses')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create warehouse: ${error.message}`);
    if (!data) throw new Error('Failed to create warehouse: No data returned');
    
    return data as WarehouseRow;
  }

  static async updateWarehouse(id: string, updates: WarehouseUpdate) {
    const { data, error } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update warehouse: ${error.message}`);
    if (!data) throw new Error('Warehouse not found');
    
    return data as WarehouseRow;
  }

  static async deleteWarehouse(id: string) {
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete warehouse: ${error.message}`);
  }

  static async getWarehousesByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('customer_id', customerId)
      .order('warehouse_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch warehouses: ${error.message}`);
    return data as WarehouseRow[];
  }

  static async getWarehouseById(id: string) {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch warehouse: ${error.message}`);
    return data as WarehouseRow | null;
  }
}
