import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderKanban, DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("active");

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch project tasks summary
  const { data: tasksSummary } = useQuery({
    queryKey: ["project-tasks-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks" as any)
        .select("project_id, status, estimated_hours, actual_hours");
      if (error) throw error;
      return data as any[];
    },
  });

  // Calculate stats
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
  const totalBudget = projects?.reduce((sum, p) => sum + (Number(p.budget_amount) || 0), 0) || 0;
  const totalHours = tasksSummary?.reduce((sum, t) => sum + (Number(t.actual_hours) || 0), 0) || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'planning': return 'secondary';
      case 'completed': return 'default';
      case 'on_hold': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'on_hold': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calculateProgress = (projectId: string) => {
    const tasks = tasksSummary?.filter(t => t.project_id === projectId);
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return (completed / tasks.length) * 100;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
            <p className="text-muted-foreground">Professional Services Automation (PSA)</p>
          </div>
          <Button>
            <FolderKanban className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBudget.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">All projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(0)}h</div>
              <p className="text-xs text-muted-foreground mt-1">Total time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Project List */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All Projects</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {projects
                ?.filter(p => selectedTab === 'all' || p.status === selectedTab)
                .map((project) => {
                  const progress = calculateProgress(project.id);
                  const projectTasks = tasksSummary?.filter(t => t.project_id === project.id);
                  const completedTasks = projectTasks?.filter(t => t.status === 'completed').length || 0;
                  const totalTasks = projectTasks?.length || 0;

                  return (
                    <Card key={project.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{project.project_name}</CardTitle>
                              <Badge variant={getStatusColor(project.status) as any}>
                                {project.status}
                              </Badge>
                              <Badge variant="outline">{project.project_type}</Badge>
                            </div>
                            <CardDescription>{project.description || "No description"}</CardDescription>
                          </div>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{completedTasks}/{totalTasks} tasks • {progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>

                        {/* Project Details */}
                        <div className="grid grid-cols-4 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="font-medium">${project.budget_amount?.toFixed(0) || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Start Date</p>
                            <p className="font-medium">{project.start_date || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">End Date</p>
                            <p className="font-medium">{project.end_date || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Priority</p>
                            <Badge variant="outline" className="mt-1">{project.priority}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {(!projects || projects.filter(p => selectedTab === 'all' || p.status === selectedTab).length === 0) && (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">No projects found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectManagement;
