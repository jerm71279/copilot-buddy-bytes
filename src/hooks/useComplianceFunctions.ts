import { useEdgeFunction } from './useEdgeFunctions';

interface BatchEvidenceGeneratorRequest {
  controlIds: string[];
  customerId?: string;
}

interface IntelligentAssistantRequest {
  query: string;
  context?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface SeedChangeTemplatesRequest {
  action?: string;
}

/**
 * Hook for compliance-related edge function invocations
 */
export function useComplianceFunctions() {
  const batchEvidenceGenerator = useEdgeFunction<BatchEvidenceGeneratorRequest, any>('batch-evidence-generator', {
    showSuccessToast: true,
    successMessage: 'Evidence generated successfully',
    showErrorToast: true,
    errorMessage: 'Failed to generate evidence',
  });

  const intelligentAssistant = useEdgeFunction<IntelligentAssistantRequest, any>('intelligent-assistant', {
    showErrorToast: true,
    errorMessage: 'Failed to get assistant response',
  });

  const seedChangeTemplates = useEdgeFunction<SeedChangeTemplatesRequest, any>('seed-change-templates', {
    showSuccessToast: true,
    successMessage: 'Templates seeded successfully',
    showErrorToast: true,
    errorMessage: 'Failed to seed templates',
  });

  return {
    batchEvidenceGenerator,
    intelligentAssistant,
    seedChangeTemplates,
  };
}
