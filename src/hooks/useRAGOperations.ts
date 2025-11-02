import { useEdgeFunction } from './useEdgeFunctions';

interface RAGQueryRequest {
  query: string;
  serverId?: string;
  topK?: number;
}

interface RAGQueryResponse {
  success: boolean;
  response: string;
  retrievedDocs: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
  }>;
  responseTime: number;
  queryId?: string;
  error?: string;
}

/**
 * Hook for RAG (Retrieval-Augmented Generation) operations
 */
export function useRAGOperations() {
  const ragQuery = useEdgeFunction<RAGQueryRequest, RAGQueryResponse>('mcp-rag-query', {
    showErrorToast: true,
    errorMessage: 'Failed to process RAG query',
  });

  return {
    ragQuery,
  };
}
