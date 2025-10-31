/**
 * CMDB Service
 * Centralized data operations for Configuration Management Database
 */

import { supabase } from "@/integrations/supabase/client";

export interface ConfigurationItem {
  id: string;
  ci_name: string;
  ci_type: string;
  ci_status: string;
  criticality: string;
  ip_address?: unknown;
  operating_system?: string;
  department?: string;
  ninjaone_device_id?: string;
  azure_resource_id?: string;
  created_at: string;
}

export interface CMDBStats {
  total: number;
  critical: number;
  active: number;
  ninjaone_synced: number;
  azure_synced: number;
}

export interface CMDBFilters {
  type?: string;
  status?: string;
}

export class CMDBService {
  /**
   * Get all configuration items with optional filters
   */
  static async getConfigurationItems(filters: CMDBFilters = {}) {
    let query = supabase
      .from("configuration_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.type && filters.type !== "all") {
      query = query.eq("ci_type", filters.type as any);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("ci_status", filters.status as any);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as ConfigurationItem[];
  }

  /**
   * Get CMDB statistics
   */
  static async getCMDBStats(): Promise<CMDBStats> {
    const cis = await this.getConfigurationItems();

    return {
      total: cis.length,
      critical: cis.filter(ci => ci.criticality === "critical").length,
      active: cis.filter(ci => ci.ci_status === "active").length,
      ninjaone_synced: cis.filter(ci => ci.ninjaone_device_id).length,
      azure_synced: cis.filter(ci => ci.azure_resource_id).length,
    };
  }

  /**
   * Sync NinjaOne devices
   */
  static async syncNinjaOneDevices() {
    const { data, error } = await supabase.functions.invoke('ninjaone-sync');
    
    if (error) throw error;
    
    return data;
  }

  /**
   * Get a single configuration item by ID
   */
  static async getConfigurationItemById(id: string) {
    const { data, error } = await supabase
      .from("configuration_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data as ConfigurationItem | null;
  }

  /**
   * Create a new configuration item
   */
  static async createConfigurationItem(ci: Partial<ConfigurationItem>) {
    const { data, error } = await supabase
      .from("configuration_items")
      .insert(ci as any)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create configuration item');
    return data as ConfigurationItem;
  }

  /**
   * Update a configuration item
   */
  static async updateConfigurationItem(id: string, updates: Partial<ConfigurationItem>) {
    const { data, error } = await supabase
      .from("configuration_items")
      .update(updates as any)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Configuration item not found');
    return data as ConfigurationItem;
  }

  /**
   * Delete a configuration item
   */
  static async deleteConfigurationItem(id: string) {
    const { error } = await supabase
      .from("configuration_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
