import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle, Clock, Award, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SecurityTraining = () => {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["security-training-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_training_modules")
        .select("*")
        .order("module_type");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ["security-training-completions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("security_training_completions")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: acknowledgments } = useQuery({
    queryKey: ["security-acknowledgments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("security_acknowledgments")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_valid", true);
      
      if (error) throw error;
      return data;
    },
  });

  const getModuleCompletion = (moduleId: string) => {
    return completions?.find(c => c.module_id === moduleId);
  };

  const calculateProgress = () => {
    if (!modules || !completions) return 0;
    const mandatory = modules.filter(m => m.is_mandatory);
    const completed = mandatory.filter(m => {
      const completion = getModuleCompletion(m.id);
      return completion?.completed_at && completion?.passed;
    });
    return Math.round((completed.length / mandatory.length) * 100);
  };

  const startModule = async (moduleId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = getModuleCompletion(moduleId);
    if (!existing) {
      const { error } = await supabase
        .from("security_training_completions")
        .insert({
          module_id: moduleId,
          user_id: user.id,
          customer_id: "00000000-0000-0000-0000-000000000000", // Will be set by trigger
        });

      if (error) {
        toast.error("Failed to start module");
        return;
      }
    }

    navigate(`/security-training/${moduleId}`);
  };

  const progress = calculateProgress();
  const mandatoryCount = modules?.filter(m => m.is_mandatory).length || 0;
  const completedCount = modules?.filter(m => {
    const completion = getModuleCompletion(m.id);
    return completion?.completed_at && completion?.passed;
  }).length || 0;

  if (modulesLoading || completionsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Security Training</h1>
        <p className="text-muted-foreground">
          Complete mandatory security training modules to ensure safe platform operations
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}/{mandatoryCount}</div>
            <p className="text-xs text-muted-foreground">Mandatory modules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acknowledgments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acknowledgments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Policies acknowledged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {progress === 100 ? (
              <Badge variant="outline" className="bg-success/10 border-success">
                <CheckCircle className="w-3 h-3 mr-1" />
                Compliant
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Incomplete
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Modules */}
      <Tabs defaultValue="mandatory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mandatory">Mandatory Training</TabsTrigger>
          <TabsTrigger value="optional">Optional Training</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="mandatory" className="space-y-4">
          {modules?.filter(m => m.is_mandatory).map(module => {
            const completion = getModuleCompletion(module.id);
            const isCompleted = completion?.completed_at && completion?.passed;

            return (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        {module.module_name}
                        {isCompleted && (
                          <Badge variant="outline" className="bg-success/10 border-success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {module.duration_minutes} min
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline">{module.module_type}</Badge>
                      <Badge>Version {module.version}</Badge>
                    </div>
                    <Button
                      onClick={() => startModule(module.id)}
                      disabled={isCompleted}
                    >
                      {isCompleted ? "Review" : completion ? "Continue" : "Start"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="optional" className="space-y-4">
          {modules?.filter(m => !m.is_mandatory).map(module => {
            const completion = getModuleCompletion(module.id);
            const isCompleted = completion?.completed_at && completion?.passed;

            return (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        {module.module_name}
                        {isCompleted && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {module.duration_minutes} min
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline">{module.module_type}</Badge>
                      <Badge variant="secondary">Optional</Badge>
                    </div>
                    <Button
                      onClick={() => startModule(module.id)}
                      variant="outline"
                    >
                      {isCompleted ? "Review" : completion ? "Continue" : "Start"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completions?.filter(c => c.completed_at && c.passed).map(completion => {
            const module = modules?.find(m => m.id === completion.module_id);
            if (!module) return null;

            return (
              <Card key={completion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-success" />
                        {module.module_name}
                      </CardTitle>
                      <CardDescription>
                        Completed on {new Date(completion.completed_at!).toLocaleDateString()}
                        {completion.score && ` • Score: ${completion.score}%`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline">{module.module_type}</Badge>
                      {completion.certificate_issued && (
                        <Badge variant="outline" className="bg-success/10 border-success">Certificate Issued</Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => navigate(`/security-training/${module.id}`)}
                      variant="outline"
                    >
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityTraining;