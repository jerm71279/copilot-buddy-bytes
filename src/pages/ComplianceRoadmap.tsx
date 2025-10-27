import { useState } from "react";
import { useComplianceRoadmap } from "@/hooks/useComplianceRoadmap";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RoadmapTimeline } from "@/components/compliance/RoadmapTimeline";
import { RoadmapMilestones } from "@/components/compliance/RoadmapMilestones";
import { RoadmapStatusBadge } from "@/components/compliance/RoadmapStatusBadge";
import { calculateOverallProgress, getStageStatistics } from "@/lib/compliance/roadmap-utils";
import { Plus, Target, TrendingUp, Wrench, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useStandardToast } from "@/hooks/useStandardToast";

const ComplianceRoadmap = () => {
  const navigate = useNavigate();
  const toast = useStandardToast();
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [lastRun, setLastRun] = useState<{
    when: Date;
    action: string;
    details: string;
    success: boolean;
  } | null>(null);
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

  const handleRebuildTemplates = async () => {
    setIsRebuilding(true);
    try {
      const rebuildBody = selectedFramework 
        ? { action: 'rebuild', frameworkIds: [selectedFramework] }
        : { action: 'rebuild' };
      
      const { data: rebuildData, error: rebuildError } = await supabase.functions.invoke('template-maintenance', {
        body: rebuildBody
      });
      
      console.log('Rebuild response:', { data: rebuildData, error: rebuildError });
      
      if (rebuildError) {
        const errorContext = JSON.stringify({
          name: rebuildError.name,
          message: rebuildError.message,
          context: (rebuildError as any).context || 'none'
        }, null, 2);
        console.error('Rebuild error details:', errorContext);
        
        setLastRun({
          when: new Date(),
          action: 'Rebuild',
          details: `Failed: ${rebuildError.message}`,
          success: false
        });
        
        toast.error(`Failed to rebuild templates: ${rebuildError.message}\n\nSee console for details.`);
        return;
      }
      
      const stageCount = rebuildData?.inserted?.stageTemplates ?? rebuildData?.stageTemplates ?? 0;
      const milestoneCount = rebuildData?.inserted?.milestoneTemplates ?? rebuildData?.milestoneTemplates ?? 0;
      
      // Auto-sanitize after rebuild
      const { data: sanitizeData, error: sanitizeError } = await supabase.functions.invoke('template-maintenance', {
        body: { action: 'sanitize' }
      });
      
      console.log('Sanitize response:', { data: sanitizeData, error: sanitizeError });
      
      if (sanitizeError) {
        console.error('Sanitize error:', sanitizeError);
        setLastRun({
          when: new Date(),
          action: 'Rebuild + Sanitize',
          details: `Rebuilt: ${stageCount} stages, ${milestoneCount} milestones. Sanitize failed: ${sanitizeError.message}`,
          success: false
        });
        
        toast.error(`Rebuild succeeded, sanitize failed: ${sanitizeError.message}`);
      } else {
        const sanitizedStages = sanitizeData?.stageTemplatesUpdated || 0;
        const sanitizedMilestones = sanitizeData?.milestoneTemplatesUpdated || 0;
        
        const details = `${stageCount} stages, ${milestoneCount} milestones inserted; ${sanitizedStages} stages, ${sanitizedMilestones} milestones sanitized`;
        setLastRun({
          when: new Date(),
          action: 'Rebuild + Sanitize',
          details,
          success: true
        });
        
        toast.success(`Templates rebuilt and sanitized\n\n${details}${selectedFramework ? '\n\nYou can now initialize the roadmap.' : ''}`);
      }
    } catch (err) {
      console.error('Unexpected rebuild error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setLastRun({
        when: new Date(),
        action: 'Rebuild',
        details: `Exception: ${errMsg}`,
        success: false
      });
      
      toast.error(`Failed to rebuild templates: ${errMsg}`);
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleSanitizeTemplates = async () => {
    setIsSanitizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('template-maintenance', {
        body: { action: 'sanitize' }
      });
      
      console.log('Sanitize response:', { data, error });
      
      if (error) {
        const errorContext = JSON.stringify({
          name: error.name,
          message: error.message,
          context: (error as any).context || 'none'
        }, null, 2);
        console.error('Sanitize error details:', errorContext);
        
        setLastRun({
          when: new Date(),
          action: 'Sanitize',
          details: `Failed: ${error.message}`,
          success: false
        });
        
        toast.error(`Failed to sanitize templates: ${error.message}\n\nSee console for details.`);
      } else {
        const stageCount = data?.stageTemplatesUpdated || 0;
        const milestoneCount = data?.milestoneTemplatesUpdated || 0;
        const details = `${stageCount} stage templates, ${milestoneCount} milestone templates updated`;
        
        setLastRun({
          when: new Date(),
          action: 'Sanitize',
          details,
          success: true
        });
        
        toast.success(`Templates sanitized: ${details}`);
      }
    } catch (err) {
      console.error('Unexpected sanitize error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setLastRun({
        when: new Date(),
        action: 'Sanitize',
        details: `Exception: ${errMsg}`,
        success: false
      });
      
      toast.error(`Failed to sanitize templates: ${errMsg}`);
    } finally {
      setIsSanitizing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading compliance roadmap..." />;
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Compliance Roadmap"
        description="Track your journey from assessment to certification"
        backButton={{ onClick: () => navigate('/compliance') }}
      />

        {/* Template Maintenance */}
        <Card className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <Wrench className="h-5 w-5" />
              Template Maintenance
            </CardTitle>
            <CardDescription>
              Rebuild or sanitize compliance roadmap templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={handleRebuildTemplates} 
                disabled={isRebuilding || isSanitizing}
                variant="outline"
                className="border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isRebuilding ? 'Rebuilding...' : selectedFramework ? 'Rebuild Selected Framework' : 'Rebuild All Templates'}
              </Button>
              <Button 
                onClick={handleSanitizeTemplates} 
                disabled={isRebuilding || isSanitizing}
                variant="outline"
                className="border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                <Wrench className="h-4 w-4 mr-2" />
                {isSanitizing ? 'Sanitizing...' : 'Sanitize Templates'}
              </Button>
            </div>
            {lastRun && (
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <span className="font-medium">Last run:</span> {lastRun.action} at {lastRun.when.toLocaleTimeString()}
                <br />
                <span className={lastRun.success ? "text-green-600" : "text-destructive"}>
                  {lastRun.details}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

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
    </DashboardLayout>
  );
};

export default ComplianceRoadmap;
