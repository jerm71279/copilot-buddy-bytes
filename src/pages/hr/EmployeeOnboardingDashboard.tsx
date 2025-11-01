import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStandardToast } from "@/hooks/useStandardToast";
import { useRequireAuth } from "@/hooks/useAuth";
import { Plus, Users, Clock, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import MCPServerStatus from "@/components/MCPServerStatus";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

interface EmployeeOnboarding {
  id: string;
  employee_name: string;
  employee_email: string;
  department: string | null;
  job_title: string | null;
  status: string;
  completion_percentage: number;
  start_date: string | null;
  target_completion_date: string | null;
  created_at: string;
}

export default function EmployeeOnboardingDashboard() {
  const navigate = useNavigate();
  const toast = useStandardToast();
  const { checkSessionAndLoad } = useRequireAuth();
  const [onboardings, setOnboardings] = useState<EmployeeOnboarding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  useEffect(() => {
    checkSessionAndLoad(loadOnboardings);

    // Reload data when window comes back into focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadOnboardings();
      }
    };

    const handleFocus = () => {
      loadOnboardings();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadOnboardings = async () => {
    try {
      // Get current user's customer_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) {
        toast.error("Please complete your profile setup first.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('employee_onboardings')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOnboardings(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const inProgress = data?.filter(o => o.status === 'in_progress').length || 0;
      const completed = data?.filter(o => o.status === 'completed').length || 0;
      const overdue = data?.filter(o => {
        if (!o.target_completion_date || o.status === 'completed') return false;
        return new Date(o.target_completion_date) < new Date();
      }).length || 0;

      setStats({ total, inProgress, completed, overdue });
    } catch (error) {
      console.error('Error loading employee onboardings:', error);
      toast.error("Failed to load employee onboardings");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "secondary",
      in_progress: "default",
      on_hold: "destructive",
      completed: "default",
      cancelled: "secondary"
    };
    return colors[status] || "secondary";
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4" />;
    if (status === 'on_hold') return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
        
        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={() => navigate('/hr/employee-onboarding/templates')}>
            <Settings className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button onClick={() => navigate('/hr/employee-onboarding/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Employee Onboarding
          </Button>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Employee Onboarding</h1>
            <p className="text-muted-foreground">Manage new employee onboarding processes</p>
          </div>
          <DashboardSettingsMenu dashboardName="Employee Onboarding" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Onboardings List */}
        {isLoading ? (
          <LoadingSpinner message="Loading employee onboardings..." />
        ) : onboardings.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employee onboardings yet"
            description='Use the "New Employee Onboarding" button above to start onboarding your first employee'
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {onboardings.map((onboarding) => (
              <Card 
                key={onboarding.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/hr/employee-onboarding/${onboarding.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {onboarding.employee_name}
                        {getStatusIcon(onboarding.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {onboarding.job_title && <>{onboarding.job_title}</>}
                        {onboarding.department && <> • {onboarding.department}</>}
                        {onboarding.start_date && (
                          <> • Start: {new Date(onboarding.start_date).toLocaleDateString()}</>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(onboarding.status) as any}>
                      {onboarding.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{onboarding.completion_percentage}%</span>
                    </div>
                    <Progress value={onboarding.completion_percentage} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <DepartmentAIAssistant department="hr" departmentLabel="HR - Employee Onboarding" />
          <MCPServerStatus filterByServerType="hr" />
        </div>
    </DashboardLayout>
  );
}
