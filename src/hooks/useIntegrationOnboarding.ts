import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IntegrationOnboardingService, Integration, OnboardingChecklistItem } from '@/services/integrationOnboardingService';
import { toast } from 'sonner';

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await IntegrationOnboardingService.getIntegrations();
      if (response.error) throw response.error;
      return response.data || [];
    },
  });
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: ['integration', id],
    queryFn: async () => {
      const response = await IntegrationOnboardingService.getIntegration(id);
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Integration>) => {
      const response = await IntegrationOnboardingService.createIntegration(data);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create integration');
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Integration> }) => {
      const response = await IntegrationOnboardingService.updateIntegration(id, updates);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration', variables.id] });
      toast.success('Integration updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update integration');
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await IntegrationOnboardingService.deleteIntegration(id);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete integration');
    },
  });
}

export function useOnboardingChecklist(integrationId: string) {
  return useQuery({
    queryKey: ['checklist', integrationId],
    queryFn: async () => {
      const response = await IntegrationOnboardingService.getOnboardingChecklist(integrationId);
      if (response.error) throw response.error;
      return response.data || [];
    },
    enabled: !!integrationId,
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OnboardingChecklistItem> }) => {
      const response = await IntegrationOnboardingService.updateChecklistItem(id, updates);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      toast.success('Checklist item updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update checklist item');
    },
  });
}

export function useInitializeChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await IntegrationOnboardingService.initializeChecklist(integrationId);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      toast.success('Checklist initialized successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to initialize checklist');
    },
  });
}

export function useIntegrationLogs(integrationName: string) {
  return useQuery({
    queryKey: ['integration-logs', integrationName],
    queryFn: async () => {
      const response = await IntegrationOnboardingService.getIntegrationLogs(integrationName);
      if (response.error) throw response.error;
      return response.data || [];
    },
    enabled: !!integrationName,
  });
}

export function useHealthCheckHistory(integrationId: string) {
  return useQuery({
    queryKey: ['health-checks', integrationId],
    queryFn: async () => {
      const response = await IntegrationOnboardingService.getHealthCheckHistory(integrationId);
      if (response.error) throw response.error;
      return response.data || [];
    },
    enabled: !!integrationId,
  });
}

export function useIntegrationStats() {
  return useQuery({
    queryKey: ['integration-stats'],
    queryFn: async () => {
      const response = await IntegrationOnboardingService.getIntegrationStats();
      if (response.error) throw response.error;
      return response.data;
    },
  });
}
