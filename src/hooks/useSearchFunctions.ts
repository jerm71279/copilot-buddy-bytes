import { useCallback } from 'react';
import { useEdgeFunction } from './useEdgeFunctions';
import { SearchResult, SearchResponse } from '@/lib/globalSearchConfig';

interface GlobalSearchRequest {
  query: string;
}

/**
 * Hook for search-related edge function invocations
 */
export function useSearchFunctions() {
  const globalSearchEdge = useEdgeFunction<GlobalSearchRequest, SearchResponse>('global-search', {
    showErrorToast: true,
    errorMessage: 'Search failed',
  });

  const performGlobalSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        globalSearchEdge.reset();
        return null;
      }
      return await globalSearchEdge.invoke({ query });
    },
    [globalSearchEdge]
  );

  return {
    ...globalSearchEdge,
    performGlobalSearch,
  };
}
