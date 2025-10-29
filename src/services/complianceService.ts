import { supabase } from "@/integrations/supabase/client";

/**
 * Compliance Service
 * Handles all compliance-related data operations
 */
export class ComplianceService {
  /**
   * Get counts for all compliance entities
   */
  static async getComplianceCounts() {
    const [frameworks, controls, reports, evidence] = await Promise.all([
      supabase.from("compliance_frameworks").select("*", { count: "exact", head: true }),
      supabase.from("compliance_controls").select("*", { count: "exact", head: true }),
      supabase.from("compliance_reports").select("*", { count: "exact", head: true }),
      supabase.from("evidence_files").select("*", { count: "exact", head: true })
    ]);

    return {
      frameworks: frameworks.count || 0,
      controls: controls.count || 0,
      reports: reports.count || 0,
      evidenceFiles: evidence.count || 0
    };
  }

  /**
   * Get all compliance frameworks for a customer
   */
  static async getFrameworksByCustomer(customerId: string) {
    const { data, error } = await (supabase as any)
      .from("compliance_frameworks")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get all compliance controls for a customer
   */
  static async getControlsByCustomer(customerId: string) {
    const { data, error } = await (supabase as any)
      .from("compliance_controls")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get all compliance reports for a customer
   */
  static async getReportsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from("compliance_reports")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get all evidence files for a customer
   */
  static async getEvidenceByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from("evidence_files")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create a new compliance framework
   */
  static async createFramework(input: any) {
    const { data, error } = await supabase
      .from("compliance_frameworks")
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new compliance control
   */
  static async createControl(input: any) {
    const { data, error } = await supabase
      .from("compliance_controls")
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new compliance report
   */
  static async createReport(input: any) {
    const { data, error } = await supabase
      .from("compliance_reports")
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Upload evidence file
   */
  static async uploadEvidence(input: any) {
    const { data, error } = await supabase
      .from("evidence_files")
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a compliance framework
   */
  static async updateFramework(id: string, updates: any) {
    const { data, error } = await supabase
      .from("compliance_frameworks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a compliance control
   */
  static async updateControl(id: string, updates: any) {
    const { data, error } = await supabase
      .from("compliance_controls")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a compliance framework
   */
  static async deleteFramework(id: string) {
    const { error } = await supabase
      .from("compliance_frameworks")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  /**
   * Delete a compliance control
   */
  static async deleteControl(id: string) {
    const { error } = await supabase
      .from("compliance_controls")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
}
