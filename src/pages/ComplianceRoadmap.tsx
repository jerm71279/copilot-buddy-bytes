import { useState } from "react";
import { useComplianceRoadmap } from "@/hooks/useComplianceRoadmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RoadmapTimeline } from "@/components/compliance/RoadmapTimeline";
import { RoadmapMilestones } from "@/components/compliance/RoadmapMilestones";
import { RoadmapStatusBadge } from "@/components/compliance/RoadmapStatusBadge";
import { calculateOverallProgress, getStageStatistics } from "@/lib/compliance/roadmap-utils";
import { Plus, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const ComplianceRoadmap = () => {
  const navigate = useNavigate();
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const { stages, milestones, frameworks, isLoading, initializeRoadmap, isReady, isInitializing, probeFrameworks, isProbing } = useComplianceRoadmap(selectedFramework);

  // Use shared utility functions
  const overallProgress = stages ? calculateOverallProgress(stages) : 0;
  const stats = stages ? getStageStatistics(stages) : {
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    blocked: 0,
    total: 0,
  };

  const handleInitializeRoadmap = async () => {
    if (selectedFramework) {
      await initializeRoadmap(selectedFramework);
    }
  };

  const handleProbe = async () => {
    await probeFrameworks();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading compliance roadmap..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Compliance Roadmap"
        description="Track your journey from assessment to certification"
        backButton={{ onClick: () => navigate('/compliance') }}
      />

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
                <Button onClick={handleInitializeRoadmap} disabled={!isReady || isInitializing} aria-disabled={!isReady || isInitializing}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isInitializing ? 'Initializing...' : 'Initialize Roadmap'}
                </Button>
              )}
              <Button variant="outline" onClick={handleProbe} disabled={!isReady || isProbing} aria-disabled={!isReady || isProbing}>
                {isProbing ? 'Probing...' : 'Probe All Frameworks'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedFramework && (
          <EmptyState
            icon={Target}
            title="Select a Framework to Begin"
            description="Choose a compliance framework from the dropdown above to view or create your roadmap"
          />
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
                  <div className="flex items-center gap-2">
                    <RoadmapStatusBadge 
                      status={stages[0]?.status || 'not_started'} 
                      type="roadmap"
                      className="border-0"
                    />
                    <span className="text-sm font-medium">{overallProgress}% Complete</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={overallProgress} className="h-3" />
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {stats.completed}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {stats.inProgress}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {stats.notStarted}
                    </div>
                    <div className="text-sm text-muted-foreground">Not Started</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-destructive">
                      {stats.blocked}
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
          <EmptyState
            icon={Target}
            title="No Roadmap Found"
            description="Initialize a roadmap for this framework to begin tracking your compliance journey"
            action={{
              label: isInitializing ? 'Initializing...' : 'Initialize Roadmap',
              onClick: handleInitializeRoadmap,
            }}
          />
        )}
    </PageContainer>
  );
};

export default ComplianceRoadmap;
