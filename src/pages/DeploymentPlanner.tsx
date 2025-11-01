import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, AlertTriangle, Users, BarChart3, Plus, Loader2, RefreshCw } from "lucide-react";
import { GanttChart } from "@/components/planner/GanttChart";
import { DependencyGraph } from "@/components/planner/DependencyGraph";
import { CriticalPath } from "@/components/planner/CriticalPath";
import { RiskMatrix } from "@/components/planner/RiskMatrix";
import { ResourceTimeline } from "@/components/planner/ResourceTimeline";
import { ProjectDialog } from "@/components/planner/ProjectDialog";
import { ProjectSelector } from "@/components/planner/ProjectSelector";
import { useDeploymentData } from "@/hooks/useDeploymentData";
import { VIEW_MODE_OPTIONS, getDefaultNewProject, type ViewMode } from "@/lib/deploymentPlannerConfig";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const DeploymentPlanner = () => {
  const {
    loading,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    projectData,
    selectedProject,
    criticalPathTasks,
    createProject,
    refreshProjectData
  } = useDeploymentData();

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState(getDefaultNewProject());

  const handleCreateProject = async () => {
    const result = await createProject(newProject);
    if (result) {
      setNewProjectOpen(false);
      setNewProject(getDefaultNewProject());
    }
  };

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

  return (
    <DashboardLayout className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Deployment Planner</h1>
          <p className="text-muted-foreground">
            Comprehensive project planning with Gantt charts, dependency tracking, and risk analysis
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProjectId && (
            <Button variant="outline" onClick={refreshProjectData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
          <ProjectDialog
            open={newProjectOpen}
            onOpenChange={setNewProjectOpen}
            newProject={newProject}
            onProjectChange={setNewProject}
            onCreateProject={handleCreateProject}
          />
        </div>
      </div>

      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        selectedProject={selectedProject}
      />

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

            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_MODE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
                    tasks={projectData.tasks}
                    milestones={projectData.milestones}
                    dependencies={projectData.dependencies}
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
                  <DependencyGraph tasks={projectData.tasks} dependencies={projectData.dependencies} />
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
                  <CriticalPath tasks={criticalPathTasks} dependencies={projectData.dependencies} />
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
                  <RiskMatrix risks={projectData.risks} />
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
                  <ResourceTimeline allocations={projectData.allocations} tasks={projectData.tasks} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
};

export default DeploymentPlanner;