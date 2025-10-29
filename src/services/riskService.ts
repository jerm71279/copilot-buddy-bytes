/**
 * Risk Service
 * Centralized risk management operations
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export class RiskService extends BaseService {
  /**
   * Get all risk assessments
   */
  static async getRiskAssessments(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("risk_assessments")
        .select("*")
        .order("inherent_score", { ascending: false });
    });
  }

  /**
   * Get risk controls
   */
  static async getRiskControls(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("risk_controls")
        .select("*");
    });
  }

  /**
   * Get risk treatments
   */
  static async getRiskTreatments(): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("risk_treatments")
        .select("*");
    });
  }

  /**
   * Calculate risk statistics
   * @param risks - Array of risk assessments
   * @param controls - Array of risk controls
   * @param treatments - Array of risk treatments
   * @returns Calculated risk statistics
   */
  static calculateRiskStats(risks: unknown[], controls: unknown[], treatments: unknown[]) {
    const riskArray = risks as Array<{ inherent_score: number; status: string }>;
    const controlArray = controls as Array<{ implementation_status: string }>;
    const treatmentArray = treatments as Array<{ status: string }>;

    return {
      totalRisks: riskArray.length,
      criticalRisks: riskArray.filter(r => r.inherent_score >= 15).length,
      highRisks: riskArray.filter(r => r.inherent_score >= 10 && r.inherent_score < 15).length,
      mediumRisks: riskArray.filter(r => r.inherent_score >= 6 && r.inherent_score < 10).length,
      lowRisks: riskArray.filter(r => r.inherent_score < 6).length,
      treatedRisks: riskArray.filter(r => r.status === 'treated' || r.status === 'monitored').length,
      activeControls: controlArray.filter(c => c.implementation_status === 'implemented' || c.implementation_status === 'verified').length,
      pendingTreatments: treatmentArray.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    };
  }

  /**
   * Create new risk assessment
   * @param riskData - Risk assessment data
   * @returns void
   * @throws Error if risk creation fails
   */
  static async createRiskAssessment(riskData: {
    customer_id: string;
    risk_title: string;
    risk_description: string;
    category: string;
    inherent_likelihood: number;
    inherent_impact: number;
    inherent_score: number;
    treatment_type: string;
    status: string;
    created_by: string;
    identified_by: string;
    risk_id: string;
  }): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from("risk_assessments")
        .insert([riskData as never]);
      
      return { data: null, error };
    });
  }
}
