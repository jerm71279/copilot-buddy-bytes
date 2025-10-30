import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { BaseService, ServiceResponse } from "./baseService";

type TimeEntryRow = Database["public"]["Tables"]["project_time_entries"]["Row"];
type TimeEntryInsert = Database["public"]["Tables"]["project_time_entries"]["Insert"];
type TimeEntryUpdate = Database["public"]["Tables"]["project_time_entries"]["Update"];

export class TimeTrackingService extends BaseService {
  /**
   * Create a new time entry
   */
  static async createTimeEntry(input: TimeEntryInsert): Promise<ServiceResponse<TimeEntryRow>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("project_time_entries")
        .insert(input)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Update an existing time entry
   */
  static async updateTimeEntry(id: string, updates: TimeEntryUpdate): Promise<ServiceResponse<TimeEntryRow>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("project_time_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Delete a time entry
   */
  static async deleteTimeEntry(id: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from("project_time_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { data: undefined, error: null };
    });
  }

  /**
   * Get time entries for a specific employee on a specific date
   */
  static async getEntriesByEmployeeAndDate(employeeId: string, date: string): Promise<ServiceResponse<TimeEntryRow[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("project_time_entries")
        .select("*, projects(project_name)")
        .eq("employee_id", employeeId)
        .eq("entry_date", date)
        .order("created_at", { ascending: false });
    });
  }

  /**
   * Get time entries for a specific employee within a date range
   */
  static async getEntriesByEmployeeAndDateRange(
    employeeId: string,
    startDate: string,
    endDate?: string
  ): Promise<ServiceResponse<Array<Pick<TimeEntryRow, 'hours' | 'is_billable' | 'billing_rate'>>>> {
    return this.executeQuery(async () => {
      let query = supabase
        .from("project_time_entries")
        .select("hours, is_billable, billing_rate")
        .eq("employee_id", employeeId)
        .gte("entry_date", startDate);

      if (endDate) {
        query = query.lte("entry_date", endDate);
      }

      return await query;
    });
  }

  /**
   * Get time entries for a specific project
   */
  static async getEntriesByProject(projectId: string): Promise<ServiceResponse<TimeEntryRow[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("project_time_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("entry_date", { ascending: false });
    });
  }

  /**
   * Approve a time entry
   */
  static async approveTimeEntry(id: string, approvedBy: string): Promise<ServiceResponse<TimeEntryRow>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("project_time_entries")
        .update({
          is_approved: true,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();
    });
  }
}
