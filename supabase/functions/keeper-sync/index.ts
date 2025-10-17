/**
 * Keeper Sync Edge Function
 * Syncs credentials from Keeper vault to platform storage
 * Uses modular shared utilities for maintainability
 */

import { getAuthContext } from '../_shared/supabaseAuth.ts';
import { validateKeeperConfig, fetchKeeperRecords } from '../_shared/keeperAuth.ts';
import { storeCredential } from '../_shared/credentialStorage.ts';
import { logCredentialSync } from '../_shared/auditLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Step 1: Validate Keeper API configuration
    const keeperApiKey = validateKeeperConfig();

    // Step 2: Authenticate user and get context
    const authHeader = req.headers.get('Authorization')!;
    const { supabase, userId, customerId } = await getAuthContext(authHeader);

    // Step 3: Parse and validate request body
    const { integration_id, folder_filter } = await req.json();

    if (!integration_id) {
      throw new Error('integration_id is required');
    }

    // Step 4: Fetch records from Keeper API
    console.log('Fetching records from Keeper API...');
    const records = await fetchKeeperRecords(keeperApiKey, folder_filter);
    console.log(`Found ${records.length} records in Keeper`);

    // Step 5: Sync each record to database
    let syncedCount = 0;
    let errorCount = 0;

    for (const record of records) {
      const { success, error } = await storeCredential(
        supabase,
        record,
        integration_id,
        customerId
      );

      if (success) {
        syncedCount++;
      } else {
        console.error(`Error syncing record ${record.title}:`, error);
        errorCount++;
      }
    }

    // Step 6: Log sync operation to audit trail
    await logCredentialSync(
      supabase,
      customerId,
      userId,
      integration_id,
      records.length,
      syncedCount,
      errorCount
    );

    // Step 7: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: records.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in keeper-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
