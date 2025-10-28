import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRequireAuth } from './useAuth';

interface Workflow {
  id: string;
  workflow_name: string;
  description: string | null;
  workflow_type: string;
  is_active: boolean;
  created_at: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  triggered_by: string;
}

interface WorkflowStats {
  total: number;
  active: number;
  executions: number;
  successRate: number;
}

export const useAutomationData = () => {
  const { checkSessionAndLoad } = useRequireAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    active: 0,
    executions: 0,
    successRate: 0
  });

  useEffect(() => {
    checkSessionAndLoad(loadWorkflows);
  }, []);

  const loadWorkflows = async () => {
    try {
      const [workflowsRes, executionsRes] = await Promise.all([
        supabase.from('workflows').select('*').order('created_at', { ascending: false }),
        supabase.from('workflow_executions').select('*').order('started_at', { ascending: false }).limit(20)
      ]);

      if (workflowsRes.error) throw workflowsRes.error;
      if (executionsRes.error) throw executionsRes.error;

      setWorkflows(workflowsRes.data || []);
      setExecutions(executionsRes.data || []);

      const total = workflowsRes.data?.length || 0;
      const active = workflowsRes.data?.filter(w => w.is_active).length || 0;
      const totalExecs = executionsRes.data?.length || 0;
      const successExecs = executionsRes.data?.filter(e => e.status === 'completed').length || 0;
      const successRate = totalExecs > 0 ? Math.round((successExecs / totalExecs) * 100) : 0;

      setStats({ total, active, executions: totalExecs, successRate });
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflows',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWorkflowStatus = async (id: string, currentIsActive: boolean) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: !currentIsActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Workflow ${!currentIsActive ? 'activated' : 'deactivated'}`
      });

      await loadWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update workflow status',
        variant: 'destructive'
      });
    }
  };

  return {
    workflows,
    executions,
    isLoading,
    stats,
    toggleWorkflowStatus,
    loadWorkflows
  };
};
