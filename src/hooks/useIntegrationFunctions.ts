import { useEdgeFunction } from './useEdgeFunctions';

interface KeeperSyncRequest {
  integration_id: string;
  folder_filter?: string | null;
}

interface GraphAPIRequest {
  endpoint: string;
  method?: string;
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

interface SharePointSyncRequest {
  syncConfigId: string;
  accessToken?: string;
}

interface SharePointSyncResponse {
  files_synced: number;
  files_failed: number;
}

// SharePoint Config Types
export interface SharePointConfig {
  id?: string;
  customer_id: string;
  site_id?: string | null;
  site_name: string;
  site_url: string;
  library_name?: string | null;
  sync_enabled: boolean;
  sync_frequency_minutes: number;
  filter_extensions?: string[] | null;
  last_sync_at?: string | null;
}

export interface SharePointLog {
  id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: string;
  files_synced: number;
  files_failed: number;
  error_message: string | null;
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

  const sharepointSync = useEdgeFunction<SharePointSyncRequest, SharePointSyncResponse>('sharepoint-sync', {
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: 'Failed to sync SharePoint documents',
  });

  const getSharePointConfigs = useEdgeFunction<void, SharePointConfig[]>(
    'get-sharepoint-configs',
    { showErrorToast: true, errorMessage: 'Failed to load sync configurations' }
  );

  const addSharePointConfig = useEdgeFunction<SharePointConfig, SharePointConfig>(
    'add-sharepoint-config',
    { showSuccessToast: true, successMessage: 'Sync configuration added' }
  );

  const updateSharePointConfig = useEdgeFunction<{ id: string; sync_enabled: boolean }, void>(
    'update-sharepoint-config',
    { showSuccessToast: true, successMessage: 'Sync configuration updated' }
  );

  const deleteSharePointConfig = useEdgeFunction<{ id: string }, void>(
    'delete-sharepoint-config',
    { showSuccessToast: true, successMessage: 'Sync configuration deleted' }
  );

  const getSharePointLogs = useEdgeFunction<void, SharePointLog[]>(
    'get-sharepoint-logs',
    { showErrorToast: true, errorMessage: 'Failed to load sync logs' }
  );

  return {
    keeperSync,
    graphAPI,
    ninjaOneTest,
    fileRepositorySync,
    githubSearch,
    sharepointSync,
    getSharePointConfigs,
    addSharePointConfig,
    updateSharePointConfig,
    deleteSharePointConfig,
    getSharePointLogs,
  };
}
