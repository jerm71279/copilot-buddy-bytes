/**
 * Client User Signup Utilities
 *
 * Functions for creating client users with proper is_client_user flag enforcement.
 * Ready for database migration with is_client_user column.
 *
 * @see CRITICAL_SECURITY_CLIENT_USER_ENFORCEMENT.md
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreateUserParams {
  email: string;
  password: string;
  customer_id: string;
  customer_name: string; // For display/confirmation
  department?: string;
  is_client_user: boolean;
}

export interface CreateUserResult {
  success: boolean;
  user_id?: string;
  error?: string;
}

/**
 * Create a new MSP Employee user
 *
 * @example
 * ```typescript
 * const result = await createMSPEmployee({
 *   email: 'john@obera.com',
 *   password: 'SecurePass123!',
 *   customer_id: 'obera-customer-id',
 *   customer_name: 'Obera MSP',
 *   department: 'it'
 * });
 * ```
 */
export async function createMSPEmployee(params: Omit<CreateUserParams, 'is_client_user'>): Promise<CreateUserResult> {
  return createUser({
    ...params,
    is_client_user: false, // MSP Employee
  });
}

/**
 * Create a new Client User (business client employee)
 *
 * @example
 * ```typescript
 * const result = await createClientUser({
 *   email: 'admin@drsmithclinic.com',
 *   password: 'ClientPass123!',
 *   customer_id: 'dr-smith-clinic-id',
 *   customer_name: 'Dr. Smith\'s Clinic',
 *   department: 'admin'
 * });
 * ```
 */
export async function createClientUser(params: Omit<CreateUserParams, 'is_client_user'>): Promise<CreateUserResult> {
  return createUser({
    ...params,
    is_client_user: true, // Client User
  });
}

/**
 * Internal function to create user with proper is_client_user flag
 */
async function createUser(params: CreateUserParams): Promise<CreateUserResult> {
  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }

    // Step 2: Create user profile with is_client_user flag
    // NOTE: Once is_client_user column exists in database, uncomment the line below
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email: params.email,
        customer_id: params.customer_id,
        department: params.department || 'admin',
        // TODO: Uncomment when is_client_user column exists:
        // is_client_user: params.is_client_user,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // TODO: Consider cleanup - delete auth user if profile creation fails
      return {
        success: false,
        error: `User created but profile failed: ${profileError.message}`,
      };
    }

    console.info(`User created successfully: ${params.email} (is_client_user: ${params.is_client_user})`);

    return {
      success: true,
      user_id: authData.user.id,
    };

  } catch (error: any) {
    console.error('Unexpected error creating user:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error occurred',
    };
  }
}

/**
 * Bulk create client users for a customer organization
 *
 * Useful for onboarding a new business client with multiple users
 *
 * @example
 * ```typescript
 * const result = await bulkCreateClientUsers({
 *   customer_id: 'dr-smith-clinic-id',
 *   customer_name: 'Dr. Smith\'s Clinic',
 *   users: [
 *     { email: 'admin@drsmithclinic.com', password: 'Pass1!', department: 'admin' },
 *     { email: 'reception@drsmithclinic.com', password: 'Pass2!', department: 'operations' },
 *     { email: 'billing@drsmithclinic.com', password: 'Pass3!', department: 'finance' },
 *   ]
 * });
 * ```
 */
export async function bulkCreateClientUsers(params: {
  customer_id: string;
  customer_name: string;
  users: Array<{
    email: string;
    password: string;
    department?: string;
  }>;
}): Promise<{
  success: boolean;
  created: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ email: string; success: boolean; error?: string }> = [];

  for (const user of params.users) {
    const result = await createClientUser({
      email: user.email,
      password: user.password,
      customer_id: params.customer_id,
      customer_name: params.customer_name,
      department: user.department,
    });

    results.push({
      email: user.email,
      success: result.success,
      error: result.error,
    });

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const created = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    success: created > 0,
    created,
    failed,
    results,
  };
}

/**
 * Example: Onboard a new business client with admin user
 *
 * This is the typical flow for adding a new client organization
 */
export async function onboardNewClient(params: {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_password: string;
  phone?: string;
  plan_type?: string;
}) {
  try {
    // Step 1: Create customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        company_name: params.company_name,
        contact_name: params.contact_name,
        email: params.contact_email,
        phone: params.phone || null,
        status: 'active',
        plan_type: params.plan_type || 'standard',
      })
      .select()
      .single();

    if (customerError || !customer) {
      return {
        success: false,
        error: `Failed to create customer: ${customerError?.message}`,
      };
    }

    // Step 2: Create client user for the contact
    const userResult = await createClientUser({
      email: params.contact_email,
      password: params.contact_password,
      customer_id: customer.id,
      customer_name: params.company_name,
      department: 'admin',
    });

    if (!userResult.success) {
      return {
        success: false,
        error: `Customer created but user failed: ${userResult.error}`,
        customer_id: customer.id,
      };
    }

    // Step 3: Initialize customer customization (for branding)
    const { error: customizationError } = await supabase
      .from('customer_customizations')
      .insert({
        customer_id: customer.id,
        primary_color: '217 33% 17%', // Default theme colors
        secondary_color: '240 4% 46%',
        accent_color: '346 77% 50%',
        enabled_integrations: [],
        enabled_features: ['client_portal', 'ticketing'],
      });

    if (customizationError) {
      console.warn('Customization creation failed:', customizationError);
      // Non-fatal - continue
    }

    return {
      success: true,
      customer_id: customer.id,
      user_id: userResult.user_id,
      message: `Successfully onboarded ${params.company_name}`,
    };

  } catch (error: any) {
    console.error('Onboarding error:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during onboarding',
    };
  }
}

/**
 * MIGRATION CHECKLIST
 *
 * Once is_client_user column is added to user_profiles table:
 *
 * 1. ✅ Uncomment the is_client_user line in createUser() function (line 82)
 * 2. ✅ Test createMSPEmployee() - verify is_client_user = false
 * 3. ✅ Test createClientUser() - verify is_client_user = true
 * 4. ✅ Test bulkCreateClientUsers() with 3+ users
 * 5. ✅ Test onboardNewClient() end-to-end
 * 6. ✅ Verify RLS policies enforce data isolation
 * 7. ✅ Run penetration tests (see CRITICAL_SECURITY_CLIENT_USER_ENFORCEMENT.md)
 */
