import { useEdgeFunction } from './useEdgeFunctions';

interface SignupCompleteRequest {
  userId: string;
  email: string;
  fullName?: string;
}

interface AIMCPGeneratorRequest {
  prompt: string;
  config?: Record<string, unknown>;
}

/**
 * Hook for authentication and onboarding edge function invocations
 */
export function useAuthFunctions() {
  const signupComplete = useEdgeFunction<SignupCompleteRequest, any>('signup-complete', {
    showSuccessToast: true,
    successMessage: 'Account setup complete',
    showErrorToast: true,
    errorMessage: 'Failed to complete signup',
  });

  const aiMCPGenerator = useEdgeFunction<AIMCPGeneratorRequest, any>('ai-mcp-generator', {
    showSuccessToast: true,
    successMessage: 'MCP configuration generated',
    showErrorToast: true,
    errorMessage: 'Failed to generate MCP config',
  });

  return {
    signupComplete,
    aiMCPGenerator,
  };
}
