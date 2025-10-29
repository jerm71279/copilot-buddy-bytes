import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingService, ClientOnboarding, OnboardingStats } from "@/services/onboardingService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import MCPServerStatus from "@/components/MCPServerStatus";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";
import DashboardNavigation from "@/components/DashboardNavigation";

/**
 * Onboarding Dashboard Data Flow
 * 
 * ```mermaid
 * graph TD
 *     A[User] -->|Visits /onboarding-dashboard| B[OnboardingDashboard Component]
 *     B -->|useEffect| C[checkAuthAndLoad]
 *     C -->|Auth Check| D[supabase.auth.getSession]
 *     
 *     D -->|Authenticated| E[loadOnboardings]
 *     E -->|Query| F[client_onboardings Table]
 *     F -->|Order by created_at| G[setOnboardings State]
 *     
 *     G -->|Calculate Stats| H[Total, In Progress, Completed, Overdue]
 *     H -->|Update| I[Stats Cards UI]
 *     
 *     J[Create Onboarding Button] -->|Navigate| K[Onboarding Creation Modal]
 *     K -->|Select Template| L[onboarding_templates Table]
 *     L -->|Load Template| M[Template Tasks]
 *     
 *     M -->|Submit| N[Insert Onboarding]
 *     N -->|Store| F
 *     N -->|Copy Tasks| O[client_onboarding_tasks Table]
 *     
 *     P[View Onboarding] -->|Click| Q[Onboarding Detail Page]
 *     Q -->|Load Tasks| O
 *     O -->|Display| R[Task List with Status]
 *     
 *     R -->|Update Task| S[Change Status/Complete]
 *     S -->|Update| O
 *     S -->|Recalculate| T[completion_percentage]
 *     T -->|Update| F
 *     
 *     U[Upload Document] -->|Task Action| V[File Upload]
 *     V -->|Store Reference| W[uploaded_documents in Task]
 *     
 *     X[Assign Task] -->|Select User| Y[Update assigned_to]
 *     Y -->|Notify| Z[User Notification]
 *     
 *     AA[Overdue Check] -->|Compare Dates| AB[target_completion_date]
 *     AB -->|Flag Overdue| AC[stats.overdue]
 *     
 *     AD[Progress Tracking] -->|Real-time| AE[Progress Bars]
 *     AE -->|Visual Feedback| AF[Color-coded Status]
 *     
 *     style A fill:#e1f5ff
 *     style F fill:#e6f7ff
 *     style L fill:#e6f7ff
 *     style O fill:#e6f7ff
 * ```
 */

export default function OnboardingDashboard() {
  const navigate = useNavigate();
  const toast = useStandardToast();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [onboardings, setOnboardings] = useState<ClientOnboarding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<OnboardingStats>({
    total_onboardings: 0,
    active_onboardings: 0,
    completed_onboardings: 0,
    avg_completion_percentage: 0,
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  const loadOnboardings = async () => {
    try {
      if (!profile?.customer_id) {
        throw new Error('Customer ID not found');
      }

      const data = await OnboardingService.getClientOnboardings(profile.customer_id);
      setOnboardings(data);
      
      const statsData = await OnboardingService.getOnboardingStats(profile.customer_id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading onboardings:', error);
      toast.error("Failed to load client onboardings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading && profile?.customer_id) {
      loadOnboardings();
    }
  }, [profileLoading, profile?.customer_id]);

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
    <DashboardLayout showDashboardNavigation={false}>
      <DashboardNavigation
          title="Client Onboarding"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics" },
            { name: "Compliance Portal", path: "/compliance" },
            { name: "Change Management", path: "/change-management" },
            { name: "Executive Dashboard", path: "/dashboard/executive" },
            { name: "Finance Dashboard", path: "/dashboard/finance" },
            { name: "HR Dashboard", path: "/dashboard/hr" },
            { name: "IT Dashboard", path: "/dashboard/it" },
            { name: "Operations Dashboard", path: "/dashboard/operations" },
            { name: "Sales Dashboard", path: "/dashboard/sales" },
            { name: "SOC Dashboard", path: "/dashboard/soc" },
          ]}
        />
        
        <div className="flex justify-end gap-2 mb-6">
          <Button onClick={() => navigate('/onboarding/templates')}>
            <Users className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button onClick={() => navigate('/onboarding/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Onboarding
          </Button>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Client Onboarding</h1>
            <p className="text-muted-foreground">Manage and track MSP customer onboarding processes</p>
          </div>
          <DashboardSettingsMenu dashboardName="Client Onboarding" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
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
              <div className="text-2xl font-bold text-primary">{stats.completed}</div>
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
          <LoadingSpinner message="Loading onboardings..." />
        ) : onboardings.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No client onboardings yet"
            description='Use the "New Onboarding" button above to start onboarding your first client'
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {onboardings.map((onboarding) => (
              <Card 
                key={onboarding.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/onboarding/${onboarding.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {onboarding.employee_name}
                        {getStatusIcon(onboarding.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Started {onboarding.start_date ? new Date(onboarding.start_date).toLocaleDateString() : 'Not started'}
                        {onboarding.target_completion_date && (
                          <> • Target: {new Date(onboarding.target_completion_date).toLocaleDateString()}</>
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
          <DepartmentAIAssistant department="onboarding" departmentLabel="Client Onboarding" />
          <MCPServerStatus filterByServerType="onboarding" />
        </div>
    </DashboardLayout>
  );
}
