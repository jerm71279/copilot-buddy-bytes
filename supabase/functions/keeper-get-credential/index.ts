/**
 * Keeper Get Credential Edge Function
 * Retrieves and decrypts synced credentials from platform storage
 * Uses modular shared utilities for maintainability
 */

import { getAuthContext } from '../_shared/supabaseAuth.ts';
import { retrieveCredential } from '../_shared/credentialStorage.ts';
import { logCredentialAccess } from '../_shared/auditLogger.ts';

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
    // Step 1: Authenticate user and get context
    const authHeader = req.headers.get('Authorization')!;
    const { supabase, userId, customerId } = await getAuthContext(authHeader);

    // Step 2: Parse and validate request body
    const { credential_name, record_uid } = await req.json();

    if (!credential_name && !record_uid) {
      throw new Error('credential_name or record_uid is required');
    }

    // Step 3: Retrieve and decrypt credential
    const decryptedData = await retrieveCredential(
      supabase,
      customerId,
      credential_name,
      record_uid
    );

    // Step 4: Log credential access to audit trail
    await logCredentialAccess(
      supabase,
      customerId,
      userId,
      decryptedData.title,
      decryptedData.recordUid
    );

    // Step 5: Return decrypted credential
    return new Response(
      JSON.stringify({
        success: true,
        credential: {
          title: decryptedData.title,
          login: decryptedData.login,
          password: decryptedData.password,
          url: decryptedData.url,
          notes: decryptedData.notes,
          custom: decryptedData.custom,
          lastSyncedAt: decryptedData.lastSyncedAt,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in keeper-get-credential:', error);
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
