/**
 * Audit Logging Module
 * Centralizes audit trail logging for Keeper operations
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

/**
 * Log credential sync operation
 * @param supabase - Supabase client
 * @param customerId - Customer ID
 * @param userId - User ID
 * @param integrationId - Integration ID
 * @param totalRecords - Total records in sync
 * @param syncedCount - Successfully synced records
 * @param errorCount - Failed records
 */
export async function logCredentialSync(
  supabase: SupabaseClient,
  customerId: string,
  userId: string,
  integrationId: string,
  totalRecords: number,
  syncedCount: number,
  errorCount: number
): Promise<void> {
  await supabase.from('audit_logs').insert({
    customer_id: customerId,
    user_id: userId,
    system_name: 'keeper',
    action_type: 'credential_sync',
    action_details: {
      integration_id: integrationId,
      total_records: totalRecords,
      synced: syncedCount,
      errors: errorCount,
    },
    compliance_tags: ['security', 'credential_management'],
  });
}

/**
 * Log credential access operation
 * @param supabase - Supabase client
 * @param customerId - Customer ID
 * @param userId - User ID
 * @param credentialName - Name of accessed credential
 * @param recordUid - Record UID
 */
export async function logCredentialAccess(
  supabase: SupabaseClient,
  customerId: string,
  userId: string,
  credentialName: string,
  recordUid: string
): Promise<void> {
  await supabase.from('audit_logs').insert({
    customer_id: customerId,
    user_id: userId,
    system_name: 'keeper',
    action_type: 'credential_access',
    action_details: {
      credential_name: credentialName,
      record_uid: recordUid,
    },
    compliance_tags: ['security', 'credential_access'],
  });
}
