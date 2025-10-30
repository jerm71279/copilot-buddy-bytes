import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, Square, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTimeTracking, type Project, type TimeEntry, type TimeStats } from "@/hooks/useTimeTracking";
import { toast } from "sonner";

const TimeTracking = () => {
  const { getProjects, getTodayEntries, getWeeklyStats, submitTimeEntry } = useTimeTracking();
  
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [activityType, setActivityType] = useState("development");
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<TimeStats>({ 
    totalHours: 0, 
    billableHours: 0, 
    revenue: 0, 
    entries: 0 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load projects
    const projectsData = await getProjects.invoke();
    if (projectsData) setProjects(projectsData);

    // Load today's entries
    const today = new Date().toISOString().split('T')[0];
    const entriesData = await getTodayEntries.invoke({ 
      startDate: today, 
      endDate: today 
    });
    if (entriesData) setTodayEntries(entriesData);

    // Load weekly stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const statsData = await getWeeklyStats.invoke({ 
      startDate: weekStart.toISOString().split('T')[0] 
    });
    if (statsData) setWeeklyStats(statsData);
  };

  const startTimer = () => {
    setStartTime(new Date());
    setIsTracking(true);
  };

  const stopTimer = () => {
    if (startTime) {
      const endTime = new Date();
      const elapsed = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      setHours(elapsed.toFixed(2));
      setIsTracking(false);
      setStartTime(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProject || !description || !hours) {
      toast.error("Please fill in all required fields");
      return;
    }

    await submitTimeEntry.invoke({
      project_id: selectedProject,
      description,
      hours: parseFloat(hours),
      activity_type: activityType,
      is_billable: true,
      entry_date: new Date().toISOString().split('T')[0],
    });

    setDescription("");
    setHours("");
    await loadData();
  };

  const todayTotal = todayEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

  return (
    <DashboardLayout>
      {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
          <p className="text-muted-foreground">Log billable hours and track project time</p>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.totalHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-1">{weeklyStats.entries} entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.billableHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                {weeklyStats.totalHours > 0 ? ((weeklyStats.billableHours / weeklyStats.totalHours) * 100).toFixed(0) : 0}% utilization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${weeklyStats.revenue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTotal.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-1">{todayEntries.length} entries</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="log">
          <TabsList>
            <TabsTrigger value="log">Log Time</TabsTrigger>
            <TabsTrigger value="entries">My Entries</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Log Time Entry</CardTitle>
                <CardDescription>Track your work hours for projects and tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timer */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6" />
                    <div>
                      <p className="font-medium">Quick Timer</p>
                      <p className="text-sm text-muted-foreground">
                        {isTracking ? `Started at ${startTime?.toLocaleTimeString()}` : "Start tracking time"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={isTracking ? stopTimer : startTimer}
                    variant={isTracking ? "destructive" : "default"}
                  >
                    {isTracking ? <><Square className="mr-2 h-4 w-4" /> Stop</> : <><Play className="mr-2 h-4 w-4" /> Start</>}
                  </Button>
                </div>

                {/* Manual Entry Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Project *</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger id="project">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.project_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity">Activity Type</Label>
                    <Select value={activityType} onValueChange={setActivityType}>
                      <SelectTrigger id="activity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">Hours *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you work on?"
                    rows={3}
                  />
                </div>

                <Button onClick={handleSubmit} disabled={submitTimeEntry.isLoading}>
                  {submitTimeEntry.isLoading ? "Saving..." : "Save Time Entry"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Time Entries</CardTitle>
                <CardDescription>Your logged hours for {new Date().toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {todayEntries.length > 0 ? (
                  <div className="space-y-3">
                    {todayEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Project</p>
                            <Badge variant={entry.is_billable ? "default" : "secondary"}>
                              {entry.is_billable ? "Billable" : "Non-billable"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.activity_type} • {entry.hours}h
                          </p>
                        </div>
                        <Badge variant="outline">{entry.status || 'pending'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No time entries for today</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
};

export default TimeTracking;
