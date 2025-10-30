/**
 * Secure Access Workstation (SAW) Service
 * Device management and access control
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface TrustedDevice {
  id: string;
  customer_id?: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string;
  device_type?: string;
  is_saw: boolean;
  security_level?: string;
  requires_mfa: boolean;
  ip_address?: string;
  last_seen_at?: string;
  is_active: boolean;
  created_at: string;
  user?: {
    full_name?: string;
  };
}

export interface BreakGlassAccess {
  id: string;
  customer_id?: string;
  user_id: string;
  requested_by: string;
  reason: string;
  access_type: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  expires_at: string;
  access_granted: boolean;
  requested_by_user?: {
    full_name?: string;
  };
  approved_by_user?: {
    full_name?: string;
  };
  user?: {
    full_name?: string;
  };
  device?: {
    device_name?: string;
    is_saw?: boolean;
  };
}

export interface DeviceSession {
  id: string;
  user_id: string;
  device_id?: string;
  session_type: string;
  ip_address: string;
  session_start: string;
  last_activity: string;
  risk_score?: number;
  privileged_operations?: Array<Record<string, unknown>>;
  is_active: boolean;
  user?: {
    full_name?: string;
  };
  device?: {
    device_name?: string;
    device_type?: string;
    is_saw?: boolean;
  };
}

export interface IPAllowlist {
  id: string;
  customer_id?: string;
  ip_range: string;
  description?: string;
  allowlist_type: string;
  expires_at?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  created_by_profile?: {
    full_name?: string;
  };
}

export class SAWService extends BaseService {
  /**
   * Get current user's profile information
   */
  static async getUserProfile(): Promise<ServiceResponse<{ customer_id: string } | null>> {
    return this.executeQuery(async () => {
      const user = await this.getCurrentUser();
      
      return await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();
    });
  }

  /**
   * Get all trusted devices
   */
  static async getTrustedDevices(): Promise<ServiceResponse<TrustedDevice[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select(`
          *,
          user:user_profiles!trusted_devices_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      
      return { data: (data || []) as unknown as TrustedDevice[], error };
    });
  }

  /**
   * Get trusted devices with registrar information
   */
  static async getTrustedDevicesWithRegistrar(): Promise<ServiceResponse<TrustedDevice[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("trusted_devices")
        .select(`
          *,
          registered_by_profile:user_profiles!trusted_devices_registered_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });
      
      return { data: data as unknown as TrustedDevice[], error };
    });
  }

  /**
   * Add trusted device
   */
  static async addTrustedDevice(deviceData: Partial<Database['public']['Tables']['trusted_devices']['Insert']>): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('trusted_devices')
        .insert([deviceData as Database['public']['Tables']['trusted_devices']['Insert']]);
      
      return { data: null, error };
    });
  }

  /**
   * Register device with current user authentication
   */
  static async registerDevice(deviceData: Partial<Database['public']['Tables']['trusted_devices']['Insert']>): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const user = await this.getCurrentUser();

      const { error } = await supabase
        .from("trusted_devices")
        .insert([{
          ...deviceData,
          registered_by: user.id
        } as Database['public']['Tables']['trusted_devices']['Insert']]);
      
      return { data: null, error };
    });
  }

  /**
   * Toggle device active status
   */
  static async toggleDevice(deviceId: string, isActive: boolean): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('trusted_devices')
        .update({ is_active: !isActive })
        .eq('id', deviceId);
      
      return { data: null, error };
    });
  }

  /**
   * Get break glass access requests
   */
  static async getBreakGlassRequests(limit: number = 50): Promise<ServiceResponse<BreakGlassAccess[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('break_glass_access')
        .select(`
          *,
          requested_by_user:user_profiles!break_glass_access_requested_by_fkey(full_name),
          approved_by_user:user_profiles!break_glass_access_approved_by_fkey(full_name),
          user:user_profiles!break_glass_access_user_id_fkey(full_name),
          device:trusted_devices(device_name, is_saw)
        `)
        .order('requested_at', { ascending: false })
        .limit(limit);
      
      return { data: (data || []) as BreakGlassAccess[], error };
    });
  }

  /**
   * Request break glass emergency access
   */
  static async requestBreakGlassAccess(requestData: Partial<Database['public']['Tables']['break_glass_access']['Insert']>): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('break_glass_access')
        .insert([{
          ...requestData,
          status: 'pending'
        } as Database['public']['Tables']['break_glass_access']['Insert']]);
      
      return { data: null, error };
    });
  }

  /**
   * Approve or deny break glass access request
   */
  static async respondToBreakGlassRequest(
    requestId: string,
    approve: boolean,
    approvedBy: string
  ): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('break_glass_access')
        .update({
          status: approve ? 'approved' : 'denied',
          approved_at: approve ? new Date().toISOString() : null,
          approved_by: approvedBy,
          access_granted: approve
        })
        .eq('id', requestId);
      
      return { data: null, error };
    });
  }

  /**
   * Get active device sessions
   */
  static async getActiveSessions(): Promise<ServiceResponse<DeviceSession[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('device_sessions')
        .select(`
          *,
          user:user_profiles!device_sessions_user_id_fkey(full_name),
          device:trusted_devices(device_name, device_type, is_saw)
        `)
        .eq('is_active', true)
        .order('session_start', { ascending: false });
      
      return { data: (data || []) as DeviceSession[], error };
    });
  }

  /**
   * Get IP allowlist entries
   */
  static async getIPAllowlist(): Promise<ServiceResponse<IPAllowlist[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('ip_allowlist')
        .select(`
          *,
          created_by_profile:user_profiles!ip_allowlist_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      
      return { data: (data || []) as IPAllowlist[], error };
    });
  }

  /**
   * Add IP address or range to allowlist
   */
  static async addIPToAllowlist(ipData: Partial<Database['public']['Tables']['ip_allowlist']['Insert']>): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('ip_allowlist')
        .insert([ipData as Database['public']['Tables']['ip_allowlist']['Insert']]);
      
      return { data: null, error };
    });
  }

  /**
   * Toggle IP allowlist entry active status
   */
  static async toggleIPStatus(ipId: string, isActive: boolean): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('ip_allowlist')
        .update({ is_active: !isActive })
        .eq('id', ipId);
      
      return { data: null, error };
    });
  }
}
