import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData = await req.json();
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const action = String(requestData.action || '').slice(0, 50);
    
    if (!action || !['create', 'get', 'delete'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Valid action is required (create, get, or delete)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      // Create test user with fixed credentials
      const testEmail = 'test.user@obera.app';
      const testPassword = 'TestUser123!';

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === testEmail);

      if (existingUser) {
        return new Response(
          JSON.stringify({
            success: true,
            user_id: existingUser.id,
            email: testEmail,
            message: 'Test user already exists'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create new test user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
        }
      });

      if (authError) throw authError;

      // Get customer_id from a random existing customer
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
      
      const customerId = customers?.[0]?.id;

      // Update user profile created by trigger with customer_id
      if (customerId) {
        await supabase
          .from('user_profiles')
          .update({
            customer_id: customerId,
            department: 'Testing'
          })
          .eq('user_id', authData.user.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: authData.user.id,
          email: testEmail,
          message: 'Test user created successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'get') {
      // Get existing test user
      const testEmail = 'test.user@obera.app';
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const testUser = existingUsers?.users?.find(u => u.email === testEmail);

      if (!testUser) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Test user not found'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: testUser.id,
          email: testUser.email,
          created_at: testUser.created_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'delete') {
      // Delete test user
      const testEmail = 'test.user@obera.app';
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const testUser = existingUsers?.users?.find(u => u.email === testEmail);

      if (testUser) {
        await supabase.auth.admin.deleteUser(testUser.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test user deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-test-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
