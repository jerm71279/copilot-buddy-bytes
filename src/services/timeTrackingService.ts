import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TimeEntryRow = Database["public"]["Tables"]["project_time_entries"]["Row"];
type TimeEntryInsert = Database["public"]["Tables"]["project_time_entries"]["Insert"];
type TimeEntryUpdate = Database["public"]["Tables"]["project_time_entries"]["Update"];

export class TimeTrackingService {
  /**
   * Create a new time entry
   */
  static async createTimeEntry(input: TimeEntryInsert): Promise<TimeEntryRow> {
    const { data, error } = await supabase
      .from("project_time_entries")
      .insert(input)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create time entry: ${error.message}`);
    if (!data) throw new Error("No data returned after creating time entry");

    return data;
  }

  /**
   * Update an existing time entry
   */
  static async updateTimeEntry(id: string, updates: TimeEntryUpdate): Promise<TimeEntryRow> {
    const { data, error } = await supabase
      .from("project_time_entries")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update time entry: ${error.message}`);
    if (!data) throw new Error("Time entry not found or update failed");

    return data;
  }

  /**
   * Delete a time entry
   */
  static async deleteTimeEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from("project_time_entries")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete time entry: ${error.message}`);
  }

  /**
   * Get time entries for a specific employee on a specific date
   */
  static async getEntriesByEmployeeAndDate(employeeId: string, date: string): Promise<TimeEntryRow[]> {
    const { data, error } = await supabase
      .from("project_time_entries")
      .select("*, projects(project_name)")
      .eq("employee_id", employeeId)
      .eq("entry_date", date)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch time entries: ${error.message}`);
    return data || [];
  }

  /**
   * Get time entries for a specific employee within a date range
   */
  static async getEntriesByEmployeeAndDateRange(
    employeeId: string,
    startDate: string,
    endDate?: string
  ): Promise<Array<Pick<TimeEntryRow, 'hours' | 'is_billable' | 'billing_rate'>>> {
    let query = supabase
      .from("project_time_entries")
      .select("hours, is_billable, billing_rate")
      .eq("employee_id", employeeId)
      .gte("entry_date", startDate);

    if (endDate) {
      query = query.lte("entry_date", endDate);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch time entries: ${error.message}`);
    return data || [];
  }

  /**
   * Get time entries for a specific project
   */
  static async getEntriesByProject(projectId: string): Promise<TimeEntryRow[]> {
    const { data, error } = await supabase
      .from("project_time_entries")
      .select("*")
      .eq("project_id", projectId)
      .order("entry_date", { ascending: false });

    if (error) throw new Error(`Failed to fetch project time entries: ${error.message}`);
    return data || [];
  }

  /**
   * Approve a time entry
   */
  static async approveTimeEntry(id: string, approvedBy: string): Promise<TimeEntryRow> {
    const { data, error } = await supabase
      .from("project_time_entries")
      .update({
        is_approved: true,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to approve time entry: ${error.message}`);
    if (!data) throw new Error("Time entry not found");

    return data;
  }
}
