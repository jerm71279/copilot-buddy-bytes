import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Search, Users, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface JobPosting {
  id: string;
  job_title: string;
  department: string;
  location: string;
  employment_type: string;
  status: string;
  posted_date: string;
  positions_available: number;
  positions_filled: number;
  application_count?: number;
}

const RecruitmentPipeline = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalJobs: 0,
    openPositions: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.customer_id) {
        toast.error("No customer profile found");
        return;
      }

      // Load job postings
      const { data: jobsData, error: jobsError } = await supabase
        .from("job_postings")
        .select("*")
        .eq("customer_id", profile.customer_id)
        .order("posted_date", { ascending: false });

      if (jobsError) throw jobsError;

      // Load applications count for each job
      const { data: applicationsData } = await supabase
        .from("job_applications")
        .select("job_posting_id")
        .eq("customer_id", profile.customer_id);

      const applicationCounts = applicationsData?.reduce((acc: any, app) => {
        acc[app.job_posting_id] = (acc[app.job_posting_id] || 0) + 1;
        return acc;
      }, {});

      const jobsWithCounts = jobsData?.map(job => ({
        ...job,
        application_count: applicationCounts?.[job.id] || 0
      })) || [];

      setJobs(jobsWithCounts);

      // Calculate stats
      const { data: interviewsData } = await supabase
        .from("interview_schedules")
        .select("id")
        .eq("customer_id", profile.customer_id)
        .eq("status", "scheduled");

      setStats({
        totalJobs: jobsData?.length || 0,
        openPositions: jobsData?.filter(j => j.status === "open").length || 0,
        totalApplications: applicationsData?.length || 0,
        interviewsScheduled: interviewsData?.length || 0,
      });

    } catch (error: any) {
      console.error("Error loading recruitment data:", error);
      toast.error("Failed to load recruitment data");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "default",
      closed: "secondary",
      filled: "outline",
      on_hold: "destructive"
    };
    return colors[status] || "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recruitment Pipeline</h1>
          <p className="text-muted-foreground">Manage job postings and track candidates</p>
        </div>
        <Button onClick={() => navigate("/hr/recruitment/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Job Posting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openPositions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewsScheduled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job Postings List */}
      <div className="grid gap-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No job postings found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/hr/recruitment/new")}
              >
                Create First Job Posting
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card 
              key={job.id} 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate(`/hr/recruitment/${job.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{job.job_title}</CardTitle>
                    <CardDescription>
                      {job.department} • {job.location} • {job.employment_type}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(job.status) as any}>
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span>Posted: {new Date(job.posted_date).toLocaleDateString()}</span>
                    <span>Positions: {job.positions_filled}/{job.positions_available}</span>
                    <span>Applications: {job.application_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RecruitmentPipeline;