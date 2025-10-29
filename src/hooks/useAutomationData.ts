import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRequireAuth } from './useAuth';
import { AutomationService, type Workflow } from '@/services/automationService';
import { AuthService } from '@/services/authService';

export type { Workflow } from '@/services/automationService';

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
      // Get user's customer ID first
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      const customerId = await AuthService.getCustomerId(user.id);
      if (!customerId) throw new Error('Customer not found');

      const workflows = await AutomationService.getWorkflows(customerId);
      
      setWorkflows(workflows);
      setExecutions([]);

      const total = workflows?.length || 0;
      const active = workflows?.filter(w => w.is_active).length || 0;
      const totalExecs = 0;
      const successRate = 0;

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
      await AutomationService.toggleWorkflow(id, !currentIsActive);

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
