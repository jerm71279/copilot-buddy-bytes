import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Shield, AlertTriangle, CheckCircle, XCircle, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const PhishingSimulations = () => {
  const queryClient = useQueryClient();
  const [selectedSimulation, setSelectedSimulation] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: simulations, isLoading: simulationsLoading } = useQuery({
    queryKey: ["phishing-simulations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phishing_simulations")
        .select("*")
        .eq("is_active", true)
        .order("difficulty_level");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["phishing-attempts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("phishing_simulation_attempts")
        .select("*, phishing_simulations(*)")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const reportPhishingMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const { error } = await supabase
        .from("phishing_simulation_attempts")
        .update({
          reported_phishing: true,
          reported_at: new Date().toISOString(),
          result: 'reported',
        })
        .eq("id", attemptId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Great job! You correctly identified and reported this phishing attempt.");
      queryClient.invalidateQueries({ queryKey: ["phishing-attempts"] });
    },
    onError: () => {
      toast.error("Failed to report phishing attempt");
    },
  });

  const calculateStats = () => {
    if (!attempts) return { total: 0, passed: 0, failed: 0, reported: 0, successRate: 0 };
    
    const total = attempts.length;
    const passed = attempts.filter(a => a.result === 'passed' || a.result === 'reported').length;
    const failed = attempts.filter(a => a.result === 'failed').length;
    const reported = attempts.filter(a => a.reported_phishing).length;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, reported, successRate };
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'passed':
      case 'reported':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const stats = calculateStats();

  if (simulationsLoading || attemptsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Phishing Simulations</h1>
        <p className="text-muted-foreground">
          Practice identifying phishing attempts in a safe environment
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.successRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Reported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.reported}</div>
            <p className="text-xs text-muted-foreground">Correctly identified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Clicked phishing links</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Available Simulations</TabsTrigger>
          <TabsTrigger value="history">Your History</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              These simulations help you recognize phishing attempts. Each simulation teaches different red flags to watch for.
            </AlertDescription>
          </Alert>

          {simulations?.map(simulation => (
            <Card key={simulation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      {simulation.campaign_name}
                    </CardTitle>
                    <CardDescription className="mt-2">{simulation.description}</CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(simulation.difficulty_level)}>
                    {simulation.difficulty_level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline">{simulation.simulation_type}</Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSimulation(simulation);
                      setShowDetails(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {attempts && attempts.length > 0 ? (
            attempts.map(attempt => {
              const simulation = attempt.phishing_simulations;
              return (
                <Card key={attempt.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Mail className="w-5 h-5" />
                          {simulation?.campaign_name}
                        </CardTitle>
                        <CardDescription>
                          Sent: {new Date(attempt.sent_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      {getResultBadge(attempt.result)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Email Opened:</span>
                        <span>{attempt.opened_at ? '✓ Yes' : '✗ No'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Clicked Link:</span>
                        <span className={attempt.clicked_link ? 'text-red-500' : ''}>
                          {attempt.clicked_link ? '✓ Yes (Failed)' : '✗ No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reported as Phishing:</span>
                        <span className={attempt.reported_phishing ? 'text-green-500' : ''}>
                          {attempt.reported_phishing ? '✓ Yes (Great!)' : '✗ No'}
                        </span>
                      </div>
                      {attempt.time_to_action_seconds && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Time to Action:</span>
                          <span>{Math.round(attempt.time_to_action_seconds / 60)} minutes</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No phishing simulation attempts yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Simulation Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {selectedSimulation?.campaign_name}
            </DialogTitle>
            <DialogDescription>
              Learn what to look for in this phishing simulation
            </DialogDescription>
          </DialogHeader>

          {selectedSimulation && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description:</h4>
                <p className="text-sm text-muted-foreground">{selectedSimulation.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Red Flags to Watch For:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {JSON.parse(selectedSimulation.target_indicators).map((indicator: string, index: number) => (
                    <li key={index} className="text-muted-foreground">{indicator}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">What You'll Learn:</h4>
                <p className="text-sm text-muted-foreground">{selectedSimulation.educational_content}</p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This is a training simulation. No real data will be compromised.
                  Practice identifying and reporting suspicious elements.
                </AlertDescription>
              </Alert>

              <Button onClick={() => setShowDetails(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhishingSimulations;