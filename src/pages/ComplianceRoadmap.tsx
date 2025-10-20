import { useState } from "react";
import { useComplianceRoadmap } from "@/hooks/useComplianceRoadmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RoadmapTimeline } from "@/components/compliance/RoadmapTimeline";
import { RoadmapMilestones } from "@/components/compliance/RoadmapMilestones";
import { Plus, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ComplianceRoadmap = () => {
  const navigate = useNavigate();
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const { stages, milestones, frameworks, isLoading, initializeRoadmap } = useComplianceRoadmap(selectedFramework);

  const calculateOverallProgress = () => {
    if (!stages || stages.length === 0) return 0;
    const total = stages.reduce((sum, stage) => sum + (stage.progress_percentage || 0), 0);
    return Math.round(total / stages.length);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'in_progress': return 'bg-primary';
      case 'blocked': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const handleInitializeRoadmap = async () => {
    if (selectedFramework) {
      await initializeRoadmap(selectedFramework);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading compliance roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Compliance Roadmap</h1>
            <p className="text-muted-foreground">
              Track your journey from assessment to certification
            </p>
          </div>
          <Button onClick={() => navigate('/compliance')}>
            Back to Compliance
          </Button>
        </div>

        {/* Framework Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Select Framework
            </CardTitle>
            <CardDescription>
              Choose the compliance framework you want to achieve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks?.map((framework) => (
                    <SelectItem key={framework.id} value={framework.id}>
                      {framework.framework_name} ({framework.framework_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFramework && !stages?.length && (
                <Button onClick={handleInitializeRoadmap}>
                  <Plus className="h-4 w-4 mr-2" />
                  Initialize Roadmap
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedFramework && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Select a Framework to Begin</h3>
              <p className="text-muted-foreground">
                Choose a compliance framework from the dropdown above to view or create your roadmap
              </p>
            </CardContent>
          </Card>
        )}

        {selectedFramework && stages && stages.length > 0 && (
          <>
            {/* Overall Progress */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Overall Progress
                    </CardTitle>
                    <CardDescription>Your compliance journey status</CardDescription>
                  </div>
                  <Badge variant="outline" className={getStatusColor(stages[0]?.status || 'not_started')}>
                    {calculateOverallProgress()}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={calculateOverallProgress()} className="h-3" />
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {stages.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {stages.filter(s => s.status === 'in_progress').length}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {stages.filter(s => s.status === 'not_started').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Not Started</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-destructive">
                      {stages.filter(s => s.status === 'blocked').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Blocked</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <div className="mb-6">
              <RoadmapTimeline stages={stages} />
            </div>

            {/* Milestones */}
            <RoadmapMilestones stages={stages} milestones={milestones} />
          </>
        )}

        {selectedFramework && stages && stages.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Roadmap Found</h3>
              <p className="text-muted-foreground mb-4">
                Initialize a roadmap for this framework to begin tracking your compliance journey
              </p>
              <Button onClick={handleInitializeRoadmap}>
                <Plus className="h-4 w-4 mr-2" />
                Initialize Roadmap
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ComplianceRoadmap;
