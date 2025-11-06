import { useEdgeFunction } from './useEdgeFunctions';

interface LangchainChatRequest {
  query: string;
  template?: string;
  model?: string;
}

interface LangchainChatResponse {
  response: string;
  model: string;
}

/**
 * Hook for Langchain operations using Lovable AI
 */
export function useLangchain() {
  const langchainChat = useEdgeFunction<LangchainChatRequest, LangchainChatResponse>('langchain-chat', {
    showErrorToast: true,
    errorMessage: 'Failed to process Langchain query',
  });

  return {
    langchainChat,
  };
}
