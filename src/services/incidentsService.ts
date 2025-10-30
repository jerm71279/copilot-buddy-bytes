/**
 * Incidents Service
 * Centralized data operations for Incident Management
 */

import { BaseService, ServiceResponse } from "./baseService";
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

export class IncidentsService extends BaseService {
  /**
   * Get all incidents ordered by detected date
   */
  static async getIncidents(): Promise<ServiceResponse<Incident[]>> {
    return this.executeQuery(async () => {
      const result = await supabase
        .from("incidents")
        .select("*")
        .order("detected_at", { ascending: false });
      
      return {
        ...result,
        data: result.data as Incident[] | null
      };
    });
  }

  /**
   * Get incident statistics
   */
  static async getIncidentStats(): Promise<ServiceResponse<IncidentStats>> {
    return this.executeQuery(async () => {
      const { data: incidents, error } = await supabase
        .from("incidents")
        .select("*");

      if (error) return { data: null, error };

      const stats = {
        open: incidents?.filter(i => i.status === "open").length || 0,
        investigating: incidents?.filter(i => i.status === "investigating").length || 0,
        resolved: incidents?.filter(i => i.status === "resolved").length || 0,
        critical: incidents?.filter(i => i.severity === "critical").length || 0,
      };

      return { data: stats, error: null };
    });
  }

  /**
   * Create a new incident
   */
  static async createIncident(incident: NewIncidentInput): Promise<ServiceResponse<Incident>> {
    return this.executeQuery(async () => {
      const user = await this.getCurrentUser();

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profile?.customer_id) {
        return { data: null, error: profileError || { message: 'User profile not found' } as any };
      }

      return await supabase
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
    });
  }

  /**
   * Trigger auto-remediation for an incident
   */
  static async triggerRemediation(incidentId: string): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase.functions.invoke("auto-remediation", {
        body: { action: "trigger_remediation", incidentId },
      });
      return { data, error };
    });
  }

  /**
   * Get a single incident by ID
   */
  static async getIncidentById(id: string): Promise<ServiceResponse<Incident | null>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("incidents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    });
  }

  /**
   * Update incident status
   */
  static async updateIncidentStatus(id: string, status: Incident["status"]): Promise<ServiceResponse<Incident>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("incidents")
        .update({ 
          status,
          resolved_at: status === "resolved" ? new Date().toISOString() : null
        })
        .eq("id", id)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Delete an incident
   */
  static async deleteIncident(id: string): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from("incidents")
        .delete()
        .eq("id", id);
      return { data: null, error };
    });
  }
}
