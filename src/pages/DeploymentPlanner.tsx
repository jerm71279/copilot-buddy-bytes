import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Network, AlertTriangle, Users, BarChart3, Plus, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GanttChart } from "@/components/planner/GanttChart";
import { DependencyGraph } from "@/components/planner/DependencyGraph";
import { CriticalPath } from "@/components/planner/CriticalPath";
import { RiskMatrix } from "@/components/planner/RiskMatrix";
import { ResourceTimeline } from "@/components/planner/ResourceTimeline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DeploymentPlanner = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"month" | "quarter" | "year">("month");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    project_name: "",
    description: "",
    project_type: "internal",
    project_status: "planning"
  });

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

      setTasks(tasksRes.data || []);
      setDependencies(depsRes.data || []);
      setMilestones(milestonesRes.data || []);
      setRisks(risksRes.data || []);
      setAllocations(allocsRes.data || []);
    } catch (error) {
      console.error("Error loading project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!customerId) {
      toast.error("Customer ID not found");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Generate project number
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
        .single();

      if (error) throw error;

      toast.success("Project created successfully");
      setProjects([data, ...projects]);
      setSelectedProjectId(data.id);
      setNewProjectOpen(false);
      setNewProject({
        project_name: "",
        description: "",
        project_type: "internal",
        project_status: "planning"
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  const criticalPathTasks = tasks.filter(t => t.is_critical_path);

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading deployment planner...</p>
        </div>
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 max-w-[1800px]" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Deployment Planner</h1>
          <p className="text-muted-foreground">
            Comprehensive project planning with Gantt charts, dependency tracking, and risk analysis
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProjectId && (
            <Button variant="outline" onClick={() => loadProjectData(selectedProjectId)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
          <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Set up a new deployment project with planning tools
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="project_name">Project Name</Label>
                  <Input
                    id="project_name"
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                    placeholder="Internal Platform Deployment"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Describe the project goals and scope..."
                  />
                </div>
                <div>
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select
                    value={newProject.project_status}
                    onValueChange={(value) => setNewProject({ ...newProject, project_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Selection */}
      {projects.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label className="font-semibold">Active Project:</Label>
              <Select value={selectedProjectId || undefined} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-[400px]">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name} - {project.project_status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && (
                <div className="flex gap-2">
                  <Badge variant="outline">{selectedProject.project_type}</Badge>
                  <Badge>{selectedProject.project_status}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first deployment project to start planning with Gantt charts, dependencies, and risk analysis.
            </p>
            <Button onClick={() => setNewProjectOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </div>
        </Card>
      ) : !selectedProjectId ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Select a project to view planning details</p>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="gantt" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="gantt">
                <BarChart3 className="w-4 h-4 mr-2" />
                Gantt Chart
              </TabsTrigger>
              <TabsTrigger value="dependencies">
                <Network className="w-4 h-4 mr-2" />
                Dependencies
              </TabsTrigger>
              <TabsTrigger value="critical">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Critical Path
              </TabsTrigger>
              <TabsTrigger value="risks">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Risk Matrix
              </TabsTrigger>
              <TabsTrigger value="resources">
                <Users className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>

            {/* View Mode Selector - Only for Gantt */}
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month View</SelectItem>
                <SelectItem value="quarter">Quarter View</SelectItem>
                <SelectItem value="year">Year View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="gantt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Visual timeline showing all tasks, dependencies, and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Loading timeline...</p>
                  </div>
                ) : (
                  <GanttChart
                    tasks={tasks}
                    milestones={milestones}
                    dependencies={dependencies}
                    viewMode={viewMode}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Dependencies</CardTitle>
                <CardDescription>
                  Visualize how tasks depend on each other and identify potential bottlenecks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Loading dependencies...</p>
                  </div>
                ) : (
                  <DependencyGraph tasks={tasks} dependencies={dependencies} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="critical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Critical Path Analysis</CardTitle>
                <CardDescription>
                  Identify the longest sequence of dependent tasks that determines project duration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Analyzing critical path...</p>
                  </div>
                ) : (
                  <CriticalPath tasks={criticalPathTasks} dependencies={dependencies} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Management Matrix</CardTitle>
                <CardDescription>
                  Assess and monitor project risks by probability and impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Loading risk matrix...</p>
                  </div>
                ) : (
                  <RiskMatrix risks={risks} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Allocation</CardTitle>
                <CardDescription>
                  Monitor team member workload and identify over/under-allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Loading resource allocation...</p>
                  </div>
                ) : (
                  <ResourceTimeline allocations={allocations} tasks={tasks} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      </main>
    </div>
  );
};

export default DeploymentPlanner;