import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnalyticsService } from "@/services/analyticsService";
import { AuthService } from "@/services/authService";

export const useAnalyticsData = (customerId: string | null, period: string) => {
  // Fetch metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['system-metrics', customerId, period],
    enabled: !!customerId,
    queryFn: () => AnalyticsService.getSystemMetrics(customerId!, period),
  });

  // Fetch alerts with auto-refresh
  const { data: alerts } = useQuery({
    queryKey: ['network-alerts', customerId],
    enabled: !!customerId,
    refetchInterval: 30000,
    queryFn: () => AnalyticsService.getNetworkAlerts(customerId!),
  });

  // Fetch benchmarks
  const { data: benchmarks } = useQuery({
    queryKey: ['performance-benchmarks', customerId],
    enabled: !!customerId,
    queryFn: () => AnalyticsService.getPerformanceBenchmarks(customerId!),
  });

  // Fetch reports
  const { data: reports } = useQuery({
    queryKey: ['generated-reports', customerId],
    enabled: !!customerId,
    queryFn: () => AnalyticsService.getGeneratedReports(customerId!),
  });

  // Mutations
  const aggregateMetricsMutation = useMutation({
    mutationFn: () => AnalyticsService.aggregateMetrics(customerId!, period),
    onSuccess: () => {
      toast.success('Metrics aggregated successfully');
      refetchMetrics();
    },
    onError: (error: Error) => {
      toast.error(`Failed to aggregate metrics: ${error.message}`);
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: () => AnalyticsService.generateReport(customerId!),
    onSuccess: () => {
      toast.success('Report generated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });

  const checkBenchmarksMutation = useMutation({
    mutationFn: () => AnalyticsService.checkBenchmarks(customerId!),
    onSuccess: () => {
      toast.success('Benchmarks checked successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to check benchmarks: ${error.message}`);
    },
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      await AnalyticsService.acknowledgeAlert(alertId, user.id);
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
