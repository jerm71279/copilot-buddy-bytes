import { useEdgeFunction } from './useEdgeFunctions';

interface IngestDocumentationRequest {
  url?: string;
  content?: string;
  title?: string;
  source?: string;
  category?: string;
  customerId?: string;
  vendorId?: string;
  metadata?: Record<string, unknown>;
}

interface ParseDocumentRequest {
  documentUrl: string;
  documentType?: string;
}

interface ExtractAPIInstructionsRequest {
  url: string;
  integrationName?: string;
}

interface AnalyzeTrainingVideosRequest {
  videoUrls: string[];
  analysisType?: string;
}

interface WorkflowInsightsRequest {
  workflowType?: string;
  metricName?: string;
  department?: string;
}

/**
 * Hook for documentation and knowledge base edge function invocations
 */
export function useDocumentationFunctions() {
  const ingestDocumentation = useEdgeFunction<IngestDocumentationRequest, any>('ingest-documentation', {
    showSuccessToast: true,
    successMessage: 'Documentation ingested successfully',
    showErrorToast: true,
    errorMessage: 'Failed to ingest documentation',
  });

  const parseDocument = useEdgeFunction<ParseDocumentRequest, any>('parse-document', {
    showErrorToast: true,
    errorMessage: 'Failed to parse document',
  });

  const extractAPIInstructions = useEdgeFunction<ExtractAPIInstructionsRequest, any>('extract-api-instructions', {
    showSuccessToast: true,
    successMessage: 'API instructions extracted',
    showErrorToast: true,
    errorMessage: 'Failed to extract API instructions',
  });

  const analyzeTrainingVideos = useEdgeFunction<AnalyzeTrainingVideosRequest, any>('analyze-training-videos', {
    showSuccessToast: true,
    successMessage: 'Training videos analyzed',
    showErrorToast: true,
    errorMessage: 'Failed to analyze training videos',
  });

  const knowledgeProcessor = useEdgeFunction<{ action: string; [key: string]: any }, any>('knowledge-processor', {
    showErrorToast: true,
    errorMessage: 'Failed to process knowledge',
  });

  const workflowInsights = useEdgeFunction<WorkflowInsightsRequest, any>('workflow-insights', {
    showErrorToast: true,
    errorMessage: 'Failed to generate workflow insights',
  });

  return {
    ingestDocumentation,
    parseDocument,
    extractAPIInstructions,
    analyzeTrainingVideos,
    knowledgeProcessor,
    workflowInsights,
  };
}
