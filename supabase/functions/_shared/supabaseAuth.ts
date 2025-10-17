/**
 * Supabase Authentication & Authorization Module
 * Centralizes user auth and customer ID retrieval
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export interface AuthContext {
  supabase: SupabaseClient<any, 'public', any>;
  userId: string;
  customerId: string;
}

/**
 * Authenticate user and retrieve customer context
 * @param authHeader - Authorization header from request
 * @returns Authenticated user context with supabase client, user ID, and customer ID
 * @throws Error if authentication fails or customer not found
 */
export async function getAuthContext(authHeader: string): Promise<AuthContext> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Extract and validate token
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's customer_id
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile?.customer_id) {
    throw new Error('Customer not found');
  }

  return {
    supabase,
    userId: user.id,
    customerId: profile.customer_id,
  };
}
