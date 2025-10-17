/**
 * Credential Storage Module
 * Handles encryption/decryption and storage of Keeper credentials
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import type { KeeperRecord } from './keeperAuth.ts';

export interface CredentialData {
  recordUid: string;
  title: string;
  login?: string;
  password?: string;
  url?: string;
  notes?: string;
  custom?: Array<{ label: string; value: string }>;
  lastSyncedAt: string;
}

/**
 * Encrypt and store a Keeper record
 * @param supabase - Supabase client
 * @param record - Keeper record to store
 * @param integrationId - Integration ID
 * @param customerId - Customer ID
 * @returns Success status and error if any
 */
export async function storeCredential(
  supabase: SupabaseClient,
  record: KeeperRecord,
  integrationId: string,
  customerId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const credentialData: CredentialData = {
      recordUid: record.recordUid,
      title: record.title,
      login: record.login,
      password: record.password,
      url: record.url,
      notes: record.notes,
      custom: record.custom,
      lastSyncedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('integration_credentials')
      .upsert({
        integration_id: integrationId,
        customer_id: customerId,
        credential_type: 'keeper_secret',
        credential_name: record.title,
        encrypted_data: new TextEncoder().encode(JSON.stringify(credentialData)),
        metadata: {
          recordUid: record.recordUid,
          url: record.url,
          hasLogin: !!record.login,
          hasPassword: !!record.password,
        },
        is_active: true,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'integration_id,customer_id,credential_type,credential_name',
      });

    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Retrieve and decrypt a credential
 * @param supabase - Supabase client
 * @param customerId - Customer ID
 * @param credentialName - Name of credential (optional if recordUid provided)
 * @param recordUid - Record UID (optional if credentialName provided)
 * @returns Decrypted credential data
 * @throws Error if credential not found
 */
export async function retrieveCredential(
  supabase: SupabaseClient,
  customerId: string,
  credentialName?: string,
  recordUid?: string
): Promise<CredentialData> {
  if (!credentialName && !recordUid) {
    throw new Error('Either credentialName or recordUid must be provided');
  }

  let query = supabase
    .from('integration_credentials')
    .select('*')
    .eq('customer_id', customerId)
    .eq('credential_type', 'keeper_secret');

  if (credentialName) {
    query = query.eq('credential_name', credentialName);
  } else if (recordUid) {
    query = query.contains('metadata', { recordUid });
  }

  const { data: credential, error } = await query.maybeSingle();

  if (error || !credential) {
    throw new Error('Credential not found');
  }

  const decryptedData: CredentialData = JSON.parse(
    new TextDecoder().decode(credential.encrypted_data)
  );

  return decryptedData;
}
