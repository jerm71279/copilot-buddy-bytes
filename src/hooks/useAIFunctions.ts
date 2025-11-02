import { useEdgeFunction } from './useEdgeFunctions';

interface AIInsightsRequest {
  customerId: string;
  analysisType?: string;
}

interface ImageGenerationRequest {
  prompt: string;
  style?: string;
}

interface VisionAnalysisRequest {
  imageBase64: string;
  prompt: string;
  analysisType: string;
  customerId: string;
}

interface ExtendedThinkingRequest {
  prompt: string;
  thinkingTime?: number;
}

interface CodeExecutionRequest {
  code: string;
  language: string;
}

interface DepartmentAssistantRequest {
  department: string;
  query: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  templateId?: string;
  useContextInjection?: boolean;
}

/**
 * Hook for AI-related edge function invocations
 */
export function useAIFunctions() {
  const aiInsights = useEdgeFunction<AIInsightsRequest, any>('ai-insights', {
    showErrorToast: true,
    errorMessage: 'Failed to generate AI insights',
  });

  const imageGeneration = useEdgeFunction<ImageGenerationRequest, any>('generate-image', {
    showErrorToast: true,
    errorMessage: 'Failed to generate image',
  });

  const visionAnalysis = useEdgeFunction<VisionAnalysisRequest, any>('vision-analyzer', {
    showErrorToast: true,
    errorMessage: 'Failed to analyze image',
  });

  const extendedThinking = useEdgeFunction<ExtendedThinkingRequest, any>('extended-thinking', {
    showErrorToast: true,
    errorMessage: 'Failed to process extended thinking request',
  });

  const codeExecution = useEdgeFunction<CodeExecutionRequest, any>('code-execution', {
    showErrorToast: true,
    errorMessage: 'Failed to execute code',
  });

  const departmentAssistant = useEdgeFunction<DepartmentAssistantRequest, any>('department-assistant', {
    showErrorToast: true,
    errorMessage: 'Failed to get assistant response',
  });

  const patternExecutor = useEdgeFunction<{ patternId: string; inputText: string }, any>('pattern-executor', {
    showErrorToast: true,
    errorMessage: 'Failed to execute pattern',
  });

  const predictiveInsights = useEdgeFunction<{ analysisType: string; customerId: string }, any>('predictive-insights', {
    showErrorToast: true,
    errorMessage: 'Failed to generate insights',
  });

  const moeRouter = useEdgeFunction<{ query: string; queryType?: string; useMultipleExperts?: boolean }, any>('moe-router', {
    showErrorToast: true,
    errorMessage: 'Failed to route query',
  });

  const seedExperts = useEdgeFunction<void, any>('seed-experts', {
    showErrorToast: true,
    errorMessage: 'Failed to seed experts',
  });

  return {
    aiInsights,
    imageGeneration,
    visionAnalysis,
    extendedThinking,
    codeExecution,
    departmentAssistant,
    patternExecutor,
    predictiveInsights,
    moeRouter,
    seedExperts,
  };
}
