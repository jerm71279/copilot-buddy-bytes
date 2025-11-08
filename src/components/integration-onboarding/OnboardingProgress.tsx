import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { OnboardingChecklistItem } from '@/services/integrationOnboardingService';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface OnboardingProgressProps {
  checklist: OnboardingChecklistItem[];
}

export function OnboardingProgress({ checklist }: OnboardingProgressProps) {
  const phases = [
    'discovery',
    'setup',
    'development',
    'workflow',
    'ui_ux',
    'testing',
    'documentation',
    'approval',
    'post_launch',
  ];

  const phaseNames: Record<string, string> = {
    discovery: 'Discovery',
    setup: 'Setup',
    development: 'Development',
    workflow: 'Workflow',
    ui_ux: 'UI/UX',
    testing: 'Testing',
    documentation: 'Documentation',
    approval: 'Approval',
    post_launch: 'Post-Launch',
  };

  const getPhaseProgress = (phase: string) => {
    const phaseItems = checklist.filter(item => item.phase === phase);
    const completed = phaseItems.filter(item => item.status === 'completed').length;
    const total = phaseItems.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getPhaseIcon = (phase: string) => {
    const progress = getPhaseProgress(phase);
    if (progress.completed === progress.total && progress.total > 0) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (progress.completed > 0) {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const totalCompleted = checklist.filter(item => item.status === 'completed').length;
  const totalItems = checklist.length;
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Onboarding Progress</CardTitle>
          <div className="text-2xl font-bold">
            {overallProgress}%
          </div>
        </div>
        <Progress value={overallProgress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {phases.map((phase) => {
            const progress = getPhaseProgress(phase);
            return (
              <div key={phase} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPhaseIcon(phase)}
                    <span className="font-medium">{phaseNames[phase]}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
