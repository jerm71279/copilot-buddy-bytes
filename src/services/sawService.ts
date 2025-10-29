/**
 * Secure Access Workstation (SAW) Service
 * Device management and access control
 */

import { supabase } from "@/integrations/supabase/client";

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
  status: string;
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
  privileged_operations?: any[];
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

export class SAWService {
  /**
   * Get current user's profile
   */
  static async getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    
    const { data, error } = await supabase
      .from("user_profiles")
      .select("customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get trusted devices
   */
  static async getTrustedDevices() {
    const { data, error } = await supabase
      .from('trusted_devices')
      .select(`
        *,
        user:user_profiles!trusted_devices_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as any;
  }

  /**
   * Get trusted devices with registrar info
   */
  static async getTrustedDevicesWithRegistrar() {
    const { data, error } = await supabase
      .from("trusted_devices")
      .select(`
        *,
        registered_by_profile:user_profiles!trusted_devices_registered_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  }

  /**
   * Add trusted device
   */
  static async addTrustedDevice(deviceData: any) {
    const { error } = await supabase
      .from('trusted_devices')
      .insert([deviceData as any]);
    
    if (error) throw error;
  }

  /**
   * Register device with user authentication
   */
  static async registerDevice(deviceData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("trusted_devices")
      .insert([{
        ...deviceData,
        registered_by: user.id
      } as any]);
    
    if (error) throw error;
  }

  /**
   * Toggle device status
   */
  static async toggleDevice(deviceId: string, isActive: boolean) {
    const { error } = await supabase
      .from('trusted_devices')
      .update({ is_active: !isActive })
      .eq('id', deviceId);
    
    if (error) throw error;
  }

  /**
   * Get break glass access requests
   */
  static async getBreakGlassRequests(limit: number = 50) {
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
    
    if (error) throw error;
    return (data || []) as any;
  }

  /**
   * Request break glass access
   */
  static async requestBreakGlassAccess(requestData: any) {
    const { error } = await supabase
      .from('break_glass_access')
      .insert([{
        ...requestData,
        status: 'pending'
      } as any]);
    
    if (error) throw error;
  }

  /**
   * Approve or deny break glass request
   */
  static async respondToBreakGlassRequest(
    requestId: string,
    approve: boolean,
    approvedBy: string
  ) {
    const { error } = await supabase
      .from('break_glass_access')
      .update({
        status: approve ? 'approved' : 'denied',
        approved_at: approve ? new Date().toISOString() : null,
        approved_by: approvedBy,
        access_granted: approve
      })
      .eq('id', requestId);
    
    if (error) throw error;
  }

  /**
   * Get active device sessions
   */
  static async getActiveSessions() {
    const { data, error } = await supabase
      .from('device_sessions')
      .select(`
        *,
        user:user_profiles!device_sessions_user_id_fkey(full_name),
        device:trusted_devices(device_name, device_type, is_saw)
      `)
      .eq('is_active', true)
      .order('session_start', { ascending: false });
    
    if (error) throw error;
    return (data || []) as any;
  }

  /**
   * Get IP allowlist
   */
  static async getIPAllowlist() {
    const { data, error } = await supabase
      .from('ip_allowlist')
      .select(`
        *,
        created_by_profile:user_profiles!ip_allowlist_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as any;
  }

  /**
   * Add IP to allowlist
   */
  static async addIPToAllowlist(ipData: any) {
    const { error } = await supabase
      .from('ip_allowlist')
      .insert([ipData as any]);
    
    if (error) throw error;
  }

  /**
   * Toggle IP allowlist status
   */
  static async toggleIPStatus(ipId: string, isActive: boolean) {
    const { error } = await supabase
      .from('ip_allowlist')
      .update({ is_active: !isActive })
      .eq('id', ipId);
    
    if (error) throw error;
  }
}
