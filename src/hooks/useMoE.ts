import { useEdgeFunction } from './useEdgeFunctions';

interface MoERequest {
  query: string;
  queryType?: 'reasoning' | 'vision' | 'code' | 'general' | 'fast_response';
  useMultipleExperts?: boolean;
}

interface MoEResponse {
  response: string;
  selectedExperts: Array<{
    id: string;
    name: string;
    specialization: string;
    score: number;
  }>;
  responseTime: number;
  useMultipleExperts: boolean;
}

/**
 * Hook for Mixture of Experts (MoE) AI routing
 * Intelligently routes queries to specialized AI experts
 */
export function useMoE() {
  const moeRouter = useEdgeFunction<MoERequest, MoEResponse>('moe-router', {
    showErrorToast: true,
    errorMessage: 'Failed to process MoE request',
  });

  return {
    ...moeRouter,
    route: moeRouter.invoke,
  };
}