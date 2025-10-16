import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAnalyticsData = (customerId: string | null, period: string) => {
  // Fetch metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['system-metrics', customerId, period],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_metrics' as any)
        .select('*')
        .eq('customer_id', customerId)
        .eq('aggregation_period', period)
        .order('period_start', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch alerts with auto-refresh
  const { data: alerts } = useQuery({
    queryKey: ['network-alerts', customerId],
    enabled: !!customerId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_alerts' as any)
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch benchmarks
  const { data: benchmarks } = useQuery({
    queryKey: ['performance-benchmarks', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_benchmarks' as any)
        .select('*')
        .eq('customer_id', customerId)
        .order('benchmark_category');
      if (error) throw error;
      return data;
    },
  });

  // Fetch reports
  const { data: reports } = useQuery({
    queryKey: ['generated-reports', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_reports' as any)
        .select('*')
        .eq('customer_id', customerId)
        .order('generated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const aggregateMetricsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-processor', {
        body: { action: 'aggregate_metrics', period, customerId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Metrics aggregated successfully');
      refetchMetrics();
    },
    onError: (error) => {
      toast.error(`Failed to aggregate metrics: ${error.message}`);
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-processor', {
        body: { action: 'generate_report', customerId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Report generated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });

  const checkBenchmarksMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-processor', {
        body: { action: 'check_benchmarks', customerId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Benchmarks checked successfully');
    },
    onError: (error) => {
      toast.error(`Failed to check benchmarks: ${error.message}`);
    },
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('real_time_alerts' as any)
        .update({
          is_acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alert acknowledged');
    },
  });

  // Helper functions
  const getMetricsByType = (type: string) => {
    return metrics?.filter((m: any) => m.metric_type === type) || [];
  };

  const criticalAlerts = alerts?.filter((a: any) => a.alert_severity === 'critical').length || 0;
  const unmetBenchmarks = benchmarks?.filter((b: any) => b.status === 'not_met').length || 0;

  return {
    metrics,
    alerts,
    benchmarks,
    reports,
    criticalAlerts,
    unmetBenchmarks,
    getMetricsByType,
    refetchMetrics,
    aggregateMetricsMutation,
    generateReportMutation,
    checkBenchmarksMutation,
    acknowledgeAlertMutation,
  };
};
