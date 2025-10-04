import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface ClientOnboarding {
  id: string;
  client_name: string;
  status: string;
  completion_percentage: number;
  start_date: string | null;
  target_completion_date: string | null;
  created_at: string;
}

export default function OnboardingDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [onboardings, setOnboardings] = useState<ClientOnboarding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    await loadOnboardings();
  };

  const loadOnboardings = async () => {
    try {
      const { data, error } = await supabase
        .from('client_onboardings')
        .select('*')
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
      console.error('Error loading onboardings:', error);
      toast({
        title: "Error",
        description: "Failed to load client onboardings",
        variant: "destructive"
      });
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Client Onboarding</h1>
            <p className="text-muted-foreground">Manage and track customer onboarding processes</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/onboarding/templates')}>
              <Users className="mr-2 h-4 w-4" />
              Templates
            </Button>
            <Button onClick={() => navigate('/onboarding/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Onboarding
            </Button>
          </div>
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
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Onboardings List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              Loading onboardings...
            </CardContent>
          </Card>
        ) : onboardings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No client onboardings yet</h3>
              <p className="text-muted-foreground mb-4">Start onboarding your first client</p>
              <Button onClick={() => navigate('/onboarding/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Onboarding
              </Button>
            </CardContent>
          </Card>
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
                        {onboarding.client_name}
                        {getStatusIcon(onboarding.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Started {new Date(onboarding.created_at).toLocaleDateString()}
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
      </main>
    </div>
  );
}
