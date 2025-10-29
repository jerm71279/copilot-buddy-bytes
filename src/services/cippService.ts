/**
 * CIPP Service
 * Centralized data operations for CIPP Dashboard
 */

import { supabase } from "@/integrations/supabase/client";

export interface CIPPTenant {
  id: string;
  tenant_id: string;
  tenant_name: string;
  default_domain_name: string;
  status: string;
  last_sync_at: string;
  sync_status: string;
}

export interface TenantHealth {
  id: string;
  tenant_id: string;
  health_score: number | null;
  security_score: number | null;
  compliance_score: number | null;
  alerts: any;
  recommendations: any;
  last_checked_at: string;
  created_at: string;
}

export class CIPPService {
  /**
   * Get user's customer ID
   */
  static async getUserCustomerId(userId: string): Promise<string | null> {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    return profile?.customer_id || null;
  }

  /**
   * Load CIPP tenants for a customer
   */
  static async getTenantsByCustomer(customerId: string): Promise<CIPPTenant[]> {
    const { data, error } = await (supabase as any)
      .from('cipp_tenants')
      .select('*')
      .eq('customer_id', customerId)
      .order('tenant_name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Load health data for specific tenants
   */
  static async getHealthDataByTenants(tenantIds: string[]): Promise<TenantHealth[]> {
    if (tenantIds.length === 0) return [];

    const { data, error } = await (supabase as any)
      .from('cipp_tenant_health')
      .select('*')
      .in('tenant_id', tenantIds)
      .order('last_checked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Sync tenants from CIPP
   */
  static async syncTenants(customerId: string) {
    const { data, error } = await supabase.functions.invoke('cipp-sync', {
      body: { 
        action: 'sync_tenants',
        customerId 
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get tenant health by tenant ID
   */
  static getTenantHealth(healthData: TenantHealth[], tenantId: string): TenantHealth | undefined {
    return healthData.find(h => h.tenant_id === tenantId);
  }

  /**
   * Get health score color class
   */
  static getHealthColor(score: number | null): string {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  }

  /**
   * Calculate tenant statistics
   */
  static calculateStats(tenants: CIPPTenant[], healthData: TenantHealth[]) {
    return {
      totalTenants: tenants.length,
      healthyTenants: healthData.filter(h => (h.health_score ?? 0) >= 80).length,
      warningTenants: healthData.filter(h => (h.health_score ?? 0) >= 60 && (h.health_score ?? 0) < 80).length,
      criticalTenants: healthData.filter(h => (h.health_score ?? 0) < 60).length,
      avgSecurityScore: healthData.length > 0 
        ? Math.round(healthData.reduce((sum, h) => sum + (h.security_score ?? 0), 0) / healthData.length)
        : 0,
    };
  }
}
