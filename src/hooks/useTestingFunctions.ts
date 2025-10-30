import { useEdgeFunction } from './useEdgeFunctions';

interface ComprehensiveTestDataRequest {
  testType?: string;
}

interface InputFuzzerRequest {
  targetEndpoint?: string;
}

interface DatabaseFlowLoggerRequest {
  operation?: string;
}

interface CreateTestUserRequest {
  action: 'create' | 'get' | 'delete';
}

/**
 * Hook for testing and admin tool edge function invocations
 */
export function useTestingFunctions() {
  const comprehensiveTestDataGenerator = useEdgeFunction<ComprehensiveTestDataRequest, any>('comprehensive-test-data-generator', {
    showSuccessToast: true,
    successMessage: 'Test data generated',
    showErrorToast: true,
    errorMessage: 'Failed to generate test data',
  });

  const inputFuzzer = useEdgeFunction<InputFuzzerRequest, any>('input-fuzzer', {
    showSuccessToast: true,
    successMessage: 'Fuzzing complete',
    showErrorToast: true,
    errorMessage: 'Failed to run fuzzer',
  });

  const databaseFlowLogger = useEdgeFunction<DatabaseFlowLoggerRequest, any>('database-flow-logger', {
    showSuccessToast: true,
    successMessage: 'Database flow logged',
    showErrorToast: true,
    errorMessage: 'Failed to log database flow',
  });

  const createTestUser = useEdgeFunction<CreateTestUserRequest, any>('create-test-user', {
    showSuccessToast: true,
    successMessage: 'Test user created',
    showErrorToast: true,
    errorMessage: 'Failed to create test user',
  });

  return {
    comprehensiveTestDataGenerator,
    inputFuzzer,
    databaseFlowLogger,
    createTestUser,
  };
}
