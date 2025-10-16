import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function useDeploymentData() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectData>({
    tasks: [],
    dependencies: [],
    milestones: [],
    risks: [],
    allocations: []
  });
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const initializeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to access deployment planner");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.customer_id) {
        toast.error("Customer profile not found");
        return;
      }

      setCustomerId(profile.customer_id);
      await loadProjects(profile.customer_id);
    } catch (error) {
      console.error("Error initializing:", error);
      toast.error("Failed to initialize deployment planner");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (custId: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("customer_id", custId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadProjectData = async (projectId: string) => {
    setLoading(true);
    try {
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

      setProjectData({
        tasks: tasksRes.data || [],
        dependencies: depsRes.data || [],
        milestones: milestonesRes.data || [],
        risks: risksRes.data || [],
        allocations: allocsRes.data || []
      });
    } catch (error) {
      console.error("Error loading project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (newProject: NewProjectForm) => {
    if (!customerId) {
      toast.error("Customer ID not found");
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const projectNumber = `PRJ${Date.now().toString().slice(-8)}`;

      const { data, error } = await supabase
        .from("projects")
        .insert({
          customer_id: customerId,
          project_number: projectNumber,
          project_manager_id: user.id,
          ...newProject
        })
        .select()
        .maybeSingle();

      if (error || !data) throw error || new Error("Failed to create project");

      toast.success("Project created successfully");
      setProjects([data, ...projects]);
      setSelectedProjectId(data.id);
      return data;
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
      return null;
    }
  };

  const refreshProjectData = () => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const criticalPathTasks = projectData.tasks.filter(t => t.is_critical_path);

  return {
    loading,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    projectData,
    customerId,
    selectedProject,
    criticalPathTasks,
    createProject,
    refreshProjectData
  };
}
