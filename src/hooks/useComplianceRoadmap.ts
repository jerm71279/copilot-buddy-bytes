import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUserCustomerId } from "@/lib/supabaseHelpers";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { 
  RoadmapStage, 
  RoadmapMilestone, 
  ComplianceFramework,
  UpdateStageParams,
  UpdateMilestoneParams 
} from "@/types/compliance-roadmap";

export const useComplianceRoadmap = (frameworkId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);
 
  useEffect(() => {
    const fetchCustomerId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const id = await getUserCustomerId(user.id);
        setCustomerId(id);
      }
      setIsCustomerLoading(false);
    };
    fetchCustomerId();
  }, []);

  // Fetch active frameworks
  const { data: frameworks } = useQuery<ComplianceFramework[]>({
    queryKey: ['compliance-frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_frameworks')
        .select('id, framework_code, framework_name, version, is_active')
        .eq('is_active', true)
        .order('framework_name');
      
      if (error) throw error;
      return data as ComplianceFramework[];
    },
  });

  // Fetch roadmap stages
  const { data: stages, isLoading } = useQuery<RoadmapStage[]>({
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
      return data as RoadmapStage[];
    },
    enabled: !!frameworkId && !!customerId,
  });

  // Fetch milestones for all stages
  const { data: milestones } = useQuery<RoadmapMilestone[]>({
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
      return data as RoadmapMilestone[];
    },
    enabled: !!frameworkId && !!customerId && !!stages?.length,
  });

  // Initialize roadmap mutation
  const initializeRoadmapMutation = useMutation({
    mutationFn: async (frameworkId: string) => {
      console.log('[ROADMAP-DEBUG] Starting initialization', {
        frameworkId,
        customerId,
        timestamp: new Date().toISOString()
      });
      
      if (!customerId) {
        console.error('[ROADMAP-DEBUG] No customer ID found');
        throw new Error('Customer ID not found');
      }
      
      console.log('[ROADMAP-DEBUG] Calling initialize-roadmap-safe edge function', {
        frameworkId,
        customerId
      });
      
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session found');
      }
      
      const { data, error } = await supabase.functions.invoke('initialize-roadmap-safe', {
        body: { frameworkId, customerId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('[ROADMAP-DEBUG] Edge function error', {
          name: (error as any).name,
          message: (error as any).message,
          context: (error as any).context || null,
        });
        throw error as any;
      }
      
      if (!data?.ok) {
        const e = data?.error || {};
        console.error('[ROADMAP-DEBUG] Initialization failed (edge response)', {
          message: e.message,
          details: e.details,
          hint: e.hint,
          code: e.code,
          diagnostics: data?.diagnostics
        });
        throw new Error(e.message || 'Initialization failed');
      }
      
      console.log('[ROADMAP-DEBUG] Initialization success', { diagnostics: data?.diagnostics });
      return data;
    },
    onSuccess: (_data, variables) => {
      const fid = variables as string;
      queryClient.invalidateQueries({ queryKey: ['compliance-roadmap-stages', fid, customerId] });
      queryClient.invalidateQueries({ queryKey: ['compliance-roadmap-milestones', fid, customerId] });
      toast({
        title: "Roadmap Initialized",
        description: "Your compliance roadmap has been created successfully",
      });
    },
    onError: (error: any) => {
      console.error('[ROADMAP-DEBUG] Initialization failed', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      const errorDetails = [];
      if (error.code) errorDetails.push(`code: ${error.code}`);
      if (error.details) errorDetails.push(`details: ${error.details}`);
      if (error.hint) errorDetails.push(`hint: ${error.hint}`);
      
      const description = error.message + (errorDetails.length > 0 ? `\n\n${errorDetails.join('\n')}` : '');
      
      toast({
        title: "Initialization Failed",
        description: `${description}\n\nCheck console for full details.`,
        variant: "destructive",
      });
    },
  });

  // Probe all frameworks initialization (diagnostic)
  const probeFrameworksMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error('Customer ID not found');
      const { data, error } = await supabase.rpc('probe_framework_initialization', {
        _customer_id: customerId,
      });
      if (error) throw error as any;
      return data as Array<{ framework_id: string; framework_name: string; status: string; error: string | null }>;
    },
    onSuccess: (data) => {
      console.table(data);
      const ok = data?.filter((r) => r.status === 'ok').length ?? 0;
      const total = data?.length ?? 0;
      toast({ title: 'Probe complete', description: `${ok}/${total} frameworks initialize`, });
    },
    onError: (error: Error) => {
      toast({ title: 'Probe failed', description: error.message, variant: 'destructive', });
    },
  });

  // Update stage status
  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, status, progress }: UpdateStageParams) => {
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
    mutationFn: async ({ milestoneId, status }: UpdateMilestoneParams) => {
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
    isReady: !!customerId && !isCustomerLoading,
    isInitializing: initializeRoadmapMutation.isPending,
    probeFrameworks: probeFrameworksMutation.mutateAsync,
    isProbing: probeFrameworksMutation.isPending,
    customerId, // Expose customerId for component to check
  };
};
