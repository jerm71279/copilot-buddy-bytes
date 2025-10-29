/**
 * Risk Service
 * Centralized risk management operations
 */

import { supabase } from "@/integrations/supabase/client";

export class RiskService {
  /**
   * Get all risk assessments
   */
  static async getRiskAssessments() {
    const { data, error } = await supabase
      .from("risk_assessments")
      .select("*")
      .order("inherent_score", { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get risk controls
   */
  static async getRiskControls() {
    const { data, error } = await supabase
      .from("risk_controls")
      .select("*");
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get risk treatments
   */
  static async getRiskTreatments() {
    const { data, error } = await supabase
      .from("risk_treatments")
      .select("*");
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Calculate risk statistics
   */
  static calculateRiskStats(risks: any[], controls: any[], treatments: any[]) {
    return {
      totalRisks: risks.length,
      criticalRisks: risks.filter(r => r.inherent_score >= 15).length,
      highRisks: risks.filter(r => r.inherent_score >= 10 && r.inherent_score < 15).length,
      mediumRisks: risks.filter(r => r.inherent_score >= 6 && r.inherent_score < 10).length,
      lowRisks: risks.filter(r => r.inherent_score < 6).length,
      treatedRisks: risks.filter(r => r.status === 'treated' || r.status === 'monitored').length,
      activeControls: controls.filter(c => c.implementation_status === 'implemented' || c.implementation_status === 'verified').length,
      pendingTreatments: treatments.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    };
  }
}
