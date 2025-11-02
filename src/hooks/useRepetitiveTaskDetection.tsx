import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useEdgeFunction } from "@/hooks/useEdgeFunction";

interface TaskDetectionParams {
  actionType: string;
  systemName: string;
  context?: Record<string, any>;
}

export const useRepetitiveTaskDetection = () => {
  const { toast } = useToast();
  const taskDetector = useEdgeFunction('repetitive-task-detector', { showErrorToast: false });
  const automationSuggester = useEdgeFunction('automation-suggester', { showErrorToast: false });

  const detectTask = useCallback(async ({ actionType, systemName, context }: TaskDetectionParams) => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        console.log('No authenticated user for task detection');
        return;
      }

      console.log(`Detecting task: ${actionType} on ${systemName}`);

      const data = await taskDetector.execute({
        userId: user.id,
        actionType,
        systemName,
        context
      });

      if (!data) return;

      console.log('Task detection result:', data);

      // If we should suggest automation, trigger the suggester
      if (data?.shouldSuggest) {
        // Query to find the task that needs a suggestion
        const { data: tasks } = await supabase
          .from('task_repetition_analysis')
          .select('id')
          .eq('user_id', user.id)
          .eq('action_type', actionType)
          .eq('system_name', systemName)
          .eq('status', 'detected')
          .order('repetition_count', { ascending: false })
          .limit(1);

        if (tasks && tasks.length > 0) {
          // Trigger automation suggester
          const suggestion = await automationSuggester.execute({ taskId: tasks[0].id });

          if (!suggestion) {
            console.error('Error generating suggestion');
            return;
          }

          // Show notification
          toast({
            title: "🤖 Automation Opportunity Detected!",
            description: `We've noticed you've repeated this task ${data.repetitionCount} times. Check your suggestions for automation ideas.`,
            duration: 8000,
          });
        }
      }
    } catch (error) {
      console.error('Failed to detect task:', error);
    }
  }, [toast, taskDetector, automationSuggester]);

  return { detectTask };
};
