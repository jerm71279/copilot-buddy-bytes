/**
 * Incidents Service
 * Centralized data operations for Incident Management
 */

import { supabase } from "@/integrations/supabase/client";

export interface Incident {
  id: string;
  incident_number: string;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  incident_type: "operational" | "security" | "performance" | "availability";
  detection_method: "manual" | "automated" | "monitoring";
  status: "open" | "investigating" | "resolved" | "closed";
  customer_id: string;
  created_by: string;
  detected_at: string;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewIncidentInput {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  incident_type: "operational" | "security" | "performance" | "availability";
  detection_method: "manual" | "automated" | "monitoring";
}

export interface IncidentStats {
  open: number;
  investigating: number;
  resolved: number;
  critical: number;
}

export class IncidentsService {
  /**
   * Get all incidents ordered by detected date
   */
  static async getIncidents() {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("detected_at", { ascending: false });
    
    if (error) throw error;
    return data as Incident[];
  }

  /**
   * Get incident statistics
   */
  static async getIncidentStats(): Promise<IncidentStats> {
    const incidents = await this.getIncidents();

    return {
      open: incidents.filter(i => i.status === "open").length,
      investigating: incidents.filter(i => i.status === "investigating").length,
      resolved: incidents.filter(i => i.status === "resolved").length,
      critical: incidents.filter(i => i.severity === "critical").length,
    };
  }

  /**
   * Create a new incident
   */
  static async createIncident(incident: NewIncidentInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.customer_id) throw new Error("User profile not found");

    const { data, error } = await supabase
      .from("incidents")
      .insert({
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        incident_type: incident.incident_type,
        detection_method: incident.detection_method,
        customer_id: profile.customer_id,
        created_by: user.id,
        incident_number: `INC-${Date.now()}`,
      })
      .select()
      .maybeSingle();
    
    if (error || !data) throw error || new Error("Failed to create incident");
    return data as Incident;
  }

  /**
   * Trigger auto-remediation for an incident
   */
  static async triggerRemediation(incidentId: string) {
    const { data, error } = await supabase.functions.invoke("auto-remediation", {
      body: { action: "trigger_remediation", incidentId },
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Get a single incident by ID
   */
  static async getIncidentById(id: string) {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data as Incident | null;
  }

  /**
   * Update incident status
   */
  static async updateIncidentStatus(id: string, status: Incident["status"]) {
    const { data, error } = await supabase
      .from("incidents")
      .update({ 
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Incident;
  }

  /**
   * Delete an incident
   */
  static async deleteIncident(id: string) {
    const { error } = await supabase
      .from("incidents")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
