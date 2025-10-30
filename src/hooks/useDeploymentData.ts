import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DeploymentService, type Project, type ProjectData, type NewProjectForm } from "@/services/deploymentService";
import { AuthService } from "@/services/authService";

export type { Project, ProjectData, NewProjectForm } from "@/services/deploymentService";

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
      const user = await AuthService.getCurrentUser();
      if (!user) {
        toast.error("Please log in to access deployment planner");
        return;
      }

      const customerId = await AuthService.getCustomerId(user.id);

      if (!customerId) {
        toast.error("Customer profile not found");
        return;
      }

      setCustomerId(customerId);
      await loadProjects(customerId);
    } catch (error) {
      console.error("Error initializing:", error);
      toast.error("Failed to initialize deployment planner");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (custId: string) => {
    try {
      const response = await DeploymentService.getProjects(custId);
      if (response.error) throw response.error;
      const data = response.data || [];
      setProjects(data);
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
      const response = await DeploymentService.getProjectData(projectId);
      if (response.error) throw response.error;
      setProjectData(response.data || {
        tasks: [],
        dependencies: [],
        milestones: [],
        risks: [],
        allocations: []
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
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      const response = await DeploymentService.createProject(customerId, user.id, newProject);
      if (response.error || !response.data) {
        throw response.error || new Error("Failed to create project");
      }
      
      const data = response.data;
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
