/**
 * Keeper API Authentication Module
 * Centralizes Keeper API interaction logic
 */

export interface KeeperRecord {
  recordUid: string;
  title: string;
  login?: string;
  password?: string;
  url?: string;
  notes?: string;
  custom?: Array<{ label: string; value: string }>;
}

export interface KeeperSyncResponse {
  records: KeeperRecord[];
}

/**
 * Fetch records from Keeper API
 * @param apiKey - Keeper API key
 * @param folderFilter - Optional folder path to filter records
 * @returns Array of Keeper records
 */
export async function fetchKeeperRecords(
  apiKey: string,
  folderFilter?: string | null
): Promise<KeeperRecord[]> {
  const response = await fetch('https://keepersecurity.com/api/rest/sm/records', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      command: 'get_records',
      folderFilter: folderFilter || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Keeper API error: ${response.statusText}`);
  }

  const data: KeeperSyncResponse = await response.json();
  return data.records || [];
}

/**
 * Validate Keeper API configuration
 * @throws Error if KEEPER_API_KEY is not configured
 */
export function validateKeeperConfig(): string {
  const keeperApiKey = Deno.env.get('KEEPER_API_KEY');
  
  if (!keeperApiKey) {
    throw new Error('KEEPER_API_KEY not configured');
  }
  
  return keeperApiKey;
}
