import { useEdgeFunction } from './useEdgeFunctions';

interface KeeperSyncRequest {
  integration_id: string;
  folder_filter?: string | null;
}

interface GraphAPIRequest {
  endpoint: string;
}

interface NinjaOneTestRequest {
  action: string;
}

interface FileRepositorySyncRequest {
  integrationId: string;
  action: string;
}

interface GitHubSearchRequest {
  query: string;
  searchType?: string;
}

/**
 * Hook for integration-related edge function invocations
 */
export function useIntegrationFunctions() {
  const keeperSync = useEdgeFunction<KeeperSyncRequest, any>('keeper-sync', {
    showSuccessToast: true,
    successMessage: 'Keeper sync initiated',
    showErrorToast: true,
    errorMessage: 'Failed to sync Keeper data',
  });

  const graphAPI = useEdgeFunction<GraphAPIRequest, any>('graph-api', {
    showErrorToast: true,
    errorMessage: 'Failed to call Microsoft Graph API',
  });

  const ninjaOneTest = useEdgeFunction<NinjaOneTestRequest, any>('test-ninjaone', {
    showErrorToast: true,
    errorMessage: 'Failed to test NinjaOne integration',
  });

  const fileRepositorySync = useEdgeFunction<FileRepositorySyncRequest, any>('file-repository-sync', {
    showSuccessToast: true,
    successMessage: 'File sync initiated',
    showErrorToast: true,
    errorMessage: 'Failed to sync files',
  });

  const githubSearch = useEdgeFunction<GitHubSearchRequest, any>('search-github', {
    showErrorToast: true,
    errorMessage: 'Failed to search GitHub',
  });

  return {
    keeperSync,
    graphAPI,
    ninjaOneTest,
    fileRepositorySync,
    githubSearch,
  };
}
