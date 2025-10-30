/**
 * Deployment Service
 * Centralized deployment/project operations
 */

import { BaseService, ServiceResponse } from "./baseService";
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

export class DeploymentService extends BaseService {
  /**
   * Get projects by customer
   */
  static async getProjects(customerId: string): Promise<ServiceResponse<Project[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from("projects")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
    });
  }

  /**
   * Get project data (tasks, dependencies, milestones, etc.)
   */
  static async getProjectData(projectId: string): Promise<ServiceResponse<ProjectData>> {
    return this.executeQuery(async () => {
      const [tasksRes, depsRes, milestonesRes, risksRes, allocsRes] = await Promise.all([
        supabase.from("project_tasks").select("*").eq("project_id", projectId).order("start_date"),
        supabase.from("task_dependencies").select("*").eq("project_id", projectId),
        supabase.from("project_milestones").select("*").eq("project_id", projectId).order("due_date"),
        supabase.from("risk_assessments").select("*").eq("project_id", projectId),
        supabase.from("resource_allocations").select("*").eq("project_id", projectId)
      ]);

      if (tasksRes.error) return { data: null, error: tasksRes.error };
      if (depsRes.error) return { data: null, error: depsRes.error };
      if (milestonesRes.error) return { data: null, error: milestonesRes.error };
      if (risksRes.error) return { data: null, error: risksRes.error };
      if (allocsRes.error) return { data: null, error: allocsRes.error };

      return {
        data: {
          tasks: tasksRes.data || [],
          dependencies: depsRes.data || [],
          milestones: milestonesRes.data || [],
          risks: risksRes.data || [],
          allocations: allocsRes.data || []
        },
        error: null
      };
    });
  }

  /**
   * Create new project
   */
  static async createProject(customerId: string, managerId: string, projectData: NewProjectForm): Promise<ServiceResponse<Project>> {
    return this.executeQuery(async () => {
      const projectNumber = `PRJ${Date.now().toString().slice(-8)}`;

      return await supabase
        .from("projects")
        .insert({
          customer_id: customerId,
          project_number: projectNumber,
          project_manager_id: managerId,
          ...projectData
        })
        .select()
        .maybeSingle();
    });
  }
}
