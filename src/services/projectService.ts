import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export class ProjectService extends BaseService {
  /**
   * Create a new project
   */
  static async createProject(input: ProjectInsert): Promise<ServiceResponse<ProjectRow>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("projects")
        .insert(input)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Update an existing project
   */
  static async updateProject(id: string, updates: ProjectUpdate): Promise<ServiceResponse<ProjectRow>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .maybeSingle();
    });
  }

  /**
   * Delete a project
   */
  static async deleteProject(id: string): Promise<ServiceResponse<null>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);
      
      return { data: null, error };
    });
  }

  /**
   * Get all projects for a specific customer
   */
  static async getProjectsByCustomer(customerId: string): Promise<ServiceResponse<ProjectRow[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("projects")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
    });
  }

  /**
   * Get a single project by ID
   */
  static async getProjectById(id: string): Promise<ServiceResponse<ProjectRow | null>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    });
  }

  /**
   * Get projects by status for a customer
   */
  static async getProjectsByStatus(customerId: string, status: string): Promise<ServiceResponse<ProjectRow[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("projects")
        .select("*")
        .eq("customer_id", customerId)
        .eq("project_status", status)
        .order("created_at", { ascending: false });
    });
  }

  /**
   * Get active projects for a customer
   */
  static async getActiveProjects(customerId: string): Promise<ServiceResponse<ProjectRow[]>> {
    return this.getProjectsByStatus(customerId, "active");
  }
}
