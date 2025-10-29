/**
 * Secure Access Workstation (SAW) Service
 * Device management and access control
 */

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

export class SAWService {
  /**
   * Get current user's profile information
   * @returns User profile with customer_id
   * @throws Error if user not authenticated or profile fetch fails
   */
  static async getUserProfile(): Promise<{ customer_id: string } | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(`Authentication error: ${authError.message}`);
    if (!user) throw new Error("Not authenticated");
    
    const { data, error } = await supabase
      .from("user_profiles")
      .select("customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (error) throw new Error(`Failed to fetch user profile: ${error.message}`);
    return data;
  }

  /**
   * Get all trusted devices
   * @returns Array of trusted devices with user information
   * @throws Error if database query fails
   */
  static async getTrustedDevices(): Promise<TrustedDevice[]> {
    const { data, error } = await supabase
      .from('trusted_devices')
      .select(`
        *,
        user:user_profiles!trusted_devices_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch trusted devices: ${error.message}`);
    return (data || []) as unknown as TrustedDevice[];
  }

  /**
   * Get trusted devices with registrar information
   * @returns Array of trusted devices with registrar profile data
   * @throws Error if database query fails
   */
  static async getTrustedDevicesWithRegistrar(): Promise<TrustedDevice[]> {
    const { data, error } = await supabase
      .from("trusted_devices")
      .select(`
        *,
        registered_by_profile:user_profiles!trusted_devices_registered_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw new Error(`Failed to fetch devices with registrar: ${error.message}`);
    return data as unknown as TrustedDevice[];
  }

  /**
   * Add trusted device
   * @param deviceData - Device configuration data
   * @throws Error if device creation fails
   */
  static async addTrustedDevice(deviceData: Partial<Database['public']['Tables']['trusted_devices']['Insert']>): Promise<void> {
    const { error } = await supabase
      .from('trusted_devices')
      .insert([deviceData as Database['public']['Tables']['trusted_devices']['Insert']]);
    
    if (error) throw new Error(`Failed to add trusted device: ${error.message}`);
  }

  /**
   * Register device with current user authentication
   * @param deviceData - Device configuration data
   * @throws Error if user not authenticated or device registration fails
   */
  static async registerDevice(deviceData: Partial<Database['public']['Tables']['trusted_devices']['Insert']>): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(`Authentication error: ${authError.message}`);
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("trusted_devices")
      .insert([{
        ...deviceData,
        registered_by: user.id
      } as Database['public']['Tables']['trusted_devices']['Insert']]);
    
    if (error) throw new Error(`Failed to register device: ${error.message}`);
  }

  /**
   * Toggle device active status
   * @param deviceId - The device's unique identifier
   * @param isActive - Current active state (will be toggled)
   * @throws Error if update fails
   */
  static async toggleDevice(deviceId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('trusted_devices')
      .update({ is_active: !isActive })
      .eq('id', deviceId);
    
    if (error) throw new Error(`Failed to toggle device status: ${error.message}`);
  }

  /**
   * Get break glass access requests
   * @param limit - Maximum number of requests to return (default: 50)
   * @returns Array of break glass access requests with user and device information
   * @throws Error if database query fails
   */
  static async getBreakGlassRequests(limit: number = 50): Promise<BreakGlassAccess[]> {
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
    
    if (error) throw new Error(`Failed to fetch break glass requests: ${error.message}`);
    return (data || []) as BreakGlassAccess[];
  }

  /**
   * Request break glass emergency access
   * @param requestData - Break glass access request details
   * @throws Error if request creation fails
   */
  static async requestBreakGlassAccess(requestData: Partial<Database['public']['Tables']['break_glass_access']['Insert']>): Promise<void> {
    const { error } = await supabase
      .from('break_glass_access')
      .insert([{
        ...requestData,
        status: 'pending'
      } as Database['public']['Tables']['break_glass_access']['Insert']]);
    
    if (error) throw new Error(`Failed to request break glass access: ${error.message}`);
  }

  /**
   * Approve or deny break glass access request
   * @param requestId - The request's unique identifier
   * @param approve - Whether to approve (true) or deny (false) the request
   * @param approvedBy - User ID of the approver
   * @throws Error if update fails
   */
  static async respondToBreakGlassRequest(
    requestId: string,
    approve: boolean,
    approvedBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('break_glass_access')
      .update({
        status: approve ? 'approved' : 'denied',
        approved_at: approve ? new Date().toISOString() : null,
        approved_by: approvedBy,
        access_granted: approve
      })
      .eq('id', requestId);
    
    if (error) throw new Error(`Failed to respond to break glass request: ${error.message}`);
  }

  /**
   * Get active device sessions
   * @returns Array of active sessions with user and device information
   * @throws Error if database query fails
   */
  static async getActiveSessions(): Promise<DeviceSession[]> {
    const { data, error } = await supabase
      .from('device_sessions')
      .select(`
        *,
        user:user_profiles!device_sessions_user_id_fkey(full_name),
        device:trusted_devices(device_name, device_type, is_saw)
      `)
      .eq('is_active', true)
      .order('session_start', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch active sessions: ${error.message}`);
    return (data || []) as DeviceSession[];
  }

  /**
   * Get IP allowlist entries
   * @returns Array of IP allowlist entries with creator information
   * @throws Error if database query fails
   */
  static async getIPAllowlist(): Promise<IPAllowlist[]> {
    const { data, error } = await supabase
      .from('ip_allowlist')
      .select(`
        *,
        created_by_profile:user_profiles!ip_allowlist_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch IP allowlist: ${error.message}`);
    return (data || []) as IPAllowlist[];
  }

  /**
   * Add IP address or range to allowlist
   * @param ipData - IP allowlist entry configuration
   * @throws Error if insertion fails
   */
  static async addIPToAllowlist(ipData: Partial<Database['public']['Tables']['ip_allowlist']['Insert']>): Promise<void> {
    const { error } = await supabase
      .from('ip_allowlist')
      .insert([ipData as Database['public']['Tables']['ip_allowlist']['Insert']]);
    
    if (error) throw new Error(`Failed to add IP to allowlist: ${error.message}`);
  }

  /**
   * Toggle IP allowlist entry active status
   * @param ipId - The IP entry's unique identifier
   * @param isActive - Current active state (will be toggled)
   * @throws Error if update fails
   */
  static async toggleIPStatus(ipId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('ip_allowlist')
      .update({ is_active: !isActive })
      .eq('id', ipId);
    
    if (error) throw new Error(`Failed to toggle IP status: ${error.message}`);
  }
}
