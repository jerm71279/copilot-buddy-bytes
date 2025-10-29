/**
 * Deployment Service
 * Centralized deployment/project operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  project_name: string;
  project_number: string;
  description: string;
  project_type: string;
  project_status: string;
  customer_id: string;
  project_manager_id: string;
  created_at: string;
}

export interface ProjectData {
  tasks: any[];
  dependencies: any[];
  milestones: any[];
  risks: any[];
  allocations: any[];
}

export interface NewProjectForm {
  project_name: string;
  description: string;
  project_type: string;
  project_status: string;
}

export class DeploymentService {
  /**
   * Get projects by customer
   */
  static async getProjects(customerId: string) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Project[];
  }

  /**
   * Get project data (tasks, dependencies, milestones, etc.)
   */
  static async getProjectData(projectId: string): Promise<ProjectData> {
    const [tasksRes, depsRes, milestonesRes, risksRes, allocsRes] = await Promise.all([
      supabase.from("project_tasks").select("*").eq("project_id", projectId).order("start_date"),
      supabase.from("task_dependencies").select("*").eq("project_id", projectId),
      supabase.from("project_milestones").select("*").eq("project_id", projectId).order("due_date"),
      supabase.from("risk_assessments").select("*").eq("project_id", projectId),
      supabase.from("resource_allocations").select("*").eq("project_id", projectId)
    ]);

    if (tasksRes.error) throw tasksRes.error;
    if (depsRes.error) throw depsRes.error;
    if (milestonesRes.error) throw milestonesRes.error;
    if (risksRes.error) throw risksRes.error;
    if (allocsRes.error) throw allocsRes.error;

    return {
      tasks: tasksRes.data || [],
      dependencies: depsRes.data || [],
      milestones: milestonesRes.data || [],
      risks: risksRes.data || [],
      allocations: allocsRes.data || []
    };
  }

  /**
   * Create new project
   */
  static async createProject(customerId: string, managerId: string, projectData: NewProjectForm) {
    const projectNumber = `PRJ${Date.now().toString().slice(-8)}`;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        customer_id: customerId,
        project_number: projectNumber,
        project_manager_id: managerId,
        ...projectData
      })
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error("Failed to create project");
    return data as Project;
  }
}
