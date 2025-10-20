import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export const useComplianceRoadmap = (frameworkId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();
        setCustomerId(profile?.customer_id || null);
      }
    };
    fetchCustomerId();
  }, []);

  // Fetch active frameworks
  const { data: frameworks } = useQuery({
    queryKey: ['compliance-frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_frameworks')
        .select('*')
        .eq('is_active', true)
        .order('framework_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch roadmap stages
  const { data: stages, isLoading } = useQuery({
    queryKey: ['compliance-roadmap-stages', frameworkId, customerId],
    queryFn: async () => {
      if (!frameworkId || !customerId) return [];
      
      const { data, error } = await supabase
        .from('compliance_roadmap_stages')
        .select('*')
        .eq('framework_id', frameworkId)
        .eq('customer_id', customerId)
        .order('stage_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!frameworkId && !!customerId,
  });

  // Fetch milestones for all stages
  const { data: milestones } = useQuery({
    queryKey: ['compliance-roadmap-milestones', frameworkId, customerId],
    queryFn: async () => {
      if (!frameworkId || !customerId || !stages?.length) return [];
      
      const stageIds = stages.map(s => s.id);
      const { data, error } = await supabase
        .from('compliance_roadmap_milestones')
        .select('*')
        .in('stage_id', stageIds)
        .order('sequence_order');
      
      if (error) throw error;
      return data;
    },
    enabled: !!frameworkId && !!customerId && !!stages?.length,
  });

  // Initialize roadmap mutation
  const initializeRoadmapMutation = useMutation({
    mutationFn: async (frameworkId: string) => {
      if (!customerId) throw new Error('Customer ID not found');
      
      const { data, error } = await supabase.rpc('initialize_compliance_roadmap', {
        _framework_id: frameworkId,
        _customer_id: customerId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-roadmap-stages'] });
      toast({
        title: "Roadmap Initialized",
        description: "Your compliance roadmap has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update stage status
  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, status, progress }: { 
      stageId: string; 
      status?: string; 
      progress?: number;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (status) {
        updates.status = status;
        if (status === 'in_progress' && !stages?.find(s => s.id === stageId)?.started_at) {
          updates.started_at = new Date().toISOString();
        }
        if (status === 'completed') {
          updates.completed_at = new Date().toISOString();
          updates.progress_percentage = 100;
        }
      }
      if (progress !== undefined) {
        updates.progress_percentage = progress;
      }

      const { error } = await supabase
        .from('compliance_roadmap_stages')
        .update(updates)
        .eq('id', stageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-roadmap-stages'] });
      toast({
        title: "Stage Updated",
        description: "Stage status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update milestone status
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, status }: { 
      milestoneId: string; 
      status: string;
    }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('compliance_roadmap_milestones')
        .update(updates)
        .eq('id', milestoneId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-roadmap-milestones'] });
      toast({
        title: "Milestone Updated",
        description: "Milestone status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    frameworks,
    stages,
    milestones,
    isLoading,
    initializeRoadmap: initializeRoadmapMutation.mutateAsync,
    updateStage: updateStageMutation.mutateAsync,
    updateMilestone: updateMilestoneMutation.mutateAsync,
  };
};
