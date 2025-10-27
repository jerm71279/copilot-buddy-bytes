import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(input: ProjectInsert): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from("projects")
      .insert(input)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create project: ${error.message}`);
    if (!data) throw new Error("No data returned after creating project");

    return data;
  }

  /**
   * Update an existing project
   */
  static async updateProject(id: string, updates: ProjectUpdate): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update project: ${error.message}`);
    if (!data) throw new Error("Project not found or update failed");

    return data;
  }

  /**
   * Delete a project
   */
  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete project: ${error.message}`);
  }

  /**
   * Get all projects for a specific customer
   */
  static async getProjectsByCustomer(customerId: string): Promise<ProjectRow[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
    return data || [];
  }

  /**
   * Get a single project by ID
   */
  static async getProjectById(id: string): Promise<ProjectRow | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch project: ${error.message}`);
    return data;
  }

  /**
   * Get projects by status for a customer
   */
  static async getProjectsByStatus(customerId: string, status: string): Promise<ProjectRow[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("customer_id", customerId)
      .eq("project_status", status)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch projects by status: ${error.message}`);
    return data || [];
  }

  /**
   * Get active projects for a customer
   */
  static async getActiveProjects(customerId: string): Promise<ProjectRow[]> {
    return this.getProjectsByStatus(customerId, "active");
  }
}
