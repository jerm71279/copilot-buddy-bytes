/**
 * Configuration Item (CI) Service
 * Centralized CI management for CMDB
 */

import { supabase } from "@/integrations/supabase/client";

export interface CIAuditLog {
  id: string;
  change_type: string;
  field_name?: string;
  old_value?: any;
  new_value?: any;
  change_reason?: string;
  source: string;
  created_at: string;
  changed_by: string;
}

export interface CIHealthMetric {
  health_score: number;
  uptime_percentage?: number;
  alert_count?: number;
  critical_alerts?: number;
  relationship_health?: number;
  compliance_score?: number;
  calculated_at: string;
}

export interface ConfigurationItem {
  id: string;
  ci_name: string;
  ci_type: string;
  criticality: string;
}

export interface CIRelationship {
  id: string;
  relationship_type: string;
  source_ci_id: string;
  target_ci_id: string;
  is_critical: boolean;
}

export class CIService {
  /**
   * Get audit logs for a configuration item
   */
  static async getAuditLogs(ciId: string, limit = 50) {
    const { data, error } = await supabase
      .from("ci_audit_log")
      .select("*")
      .eq("ci_id", ciId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get health metrics for a configuration item
   */
  static async getHealthMetrics(ciId: string) {
    const { data, error } = await supabase
      .from("ci_health_metrics")
      .select("*")
      .eq("ci_id", ciId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Calculate health score for a configuration item
   */
  static async calculateHealth(ciId: string, customerId: string) {
    // Call the health calculation function
    const { data: healthScore, error: funcError } = await supabase
      .rpc("calculate_ci_health", { ci_id_param: ciId });

    if (funcError) throw funcError;

    // Insert new health metric
    const { data: newMetric, error: insertError } = await supabase
      .from("ci_health_metrics")
      .insert({
        ci_id: ciId,
        customer_id: customerId,
        health_score: healthScore,
        calculated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (insertError || !newMetric) throw insertError || new Error("Failed to insert health metric");

    return newMetric;
  }

  /**
   * Get configuration item by ID
   */
  static async getConfigurationItem(ciId: string) {
    const { data, error } = await supabase
      .from("configuration_items")
      .select("ci_name, ci_type, criticality")
      .eq("id", ciId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Get outbound relationships for a CI
   */
  static async getOutboundRelationships(ciId: string) {
    const { data, error } = await supabase
      .from("ci_relationships")
      .select(`
        id,
        relationship_type,
        target_ci_id,
        is_critical,
        target:configuration_items!ci_relationships_target_ci_id_fkey(id, ci_name, ci_type, criticality)
      `)
      .eq("source_ci_id", ciId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get inbound relationships for a CI
   */
  static async getInboundRelationships(ciId: string) {
    const { data, error } = await supabase
      .from("ci_relationships")
      .select(`
        id,
        relationship_type,
        source_ci_id,
        is_critical,
        source:configuration_items!ci_relationships_source_ci_id_fkey(id, ci_name, ci_type, criticality)
      `)
      .eq("target_ci_id", ciId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get complete relationship map for a CI
   */
  static async getRelationshipMap(ciId: string) {
    const [currentCI, outbound, inbound] = await Promise.all([
      this.getConfigurationItem(ciId),
      this.getOutboundRelationships(ciId),
      this.getInboundRelationships(ciId)
    ]);

    if (!currentCI) throw new Error("Configuration item not found");

    return {
      currentCI,
      outbound,
      inbound
    };
  }

  /**
   * Count recent automated change requests
   */
  static async countRecentAutomatedChanges(hoursAgo = 24) {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursAgo);

    const { count } = await supabase
      .from('change_requests')
      .select('*', { count: 'exact', head: true })
      .contains('compliance_tags', ['automated'])
      .gte('created_at', threshold.toISOString());

    return count || 0;
  }
}
