import { useEdgeFunction } from './useEdgeFunctions';

interface AnalyticsEngineRequest {
  analysisType: string;
  filters?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
}

interface CustomReportRequest {
  reportConfig: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

interface CentralMMLProcessorRequest {
  operation: string;
  data?: Record<string, unknown>;
}

/**
 * Hook for analytics and reporting edge function invocations
 */
export function useAnalyticsFunctions() {
  const analyticsEngine = useEdgeFunction<AnalyticsEngineRequest, any>('analytics-engine', {
    showErrorToast: true,
    errorMessage: 'Failed to run analytics',
  });

  const customReportEngine = useEdgeFunction<CustomReportRequest, any>('custom-report-engine', {
    showSuccessToast: true,
    successMessage: 'Report generated successfully',
    showErrorToast: true,
    errorMessage: 'Failed to generate report',
  });

  const centralMMLProcessor = useEdgeFunction<CentralMMLProcessorRequest, any>('central-mml-processor', {
    showErrorToast: true,
    errorMessage: 'Failed to process MML data',
  });

  return {
    analyticsEngine,
    customReportEngine,
    centralMMLProcessor,
  };
}
