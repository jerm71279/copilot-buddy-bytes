import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SignupRequest {
  userId: string
  fullName: string
  emailUsername: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for bypassing RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestData = await req.json()
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = String(requestData.userId || '').trim()
    const fullName = String(requestData.fullName || '').trim().slice(0, 200)
    const emailUsername = String(requestData.emailUsername || '').trim().slice(0, 100)

    if (!userId || !fullName || !emailUsername) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, fullName, emailUsername' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing signup for user: ${userId}`)

    // Step 1: Get or create default customer
    const companyName = "OBERACONNECT, LLC"
    const defaultEmail = "admin@oberaconnect.com"
    const defaultContact = "Administrator"

    let customerId: string | null = null

    // Check if default customer exists
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('company_name', companyName)
      .maybeSingle()

    if (existingCustomer) {
      customerId = existingCustomer.id
      console.log(`Using existing customer: ${customerId}`)
    } else {
      // Create default customer
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          company_name: companyName,
          contact_name: defaultContact,
          email: defaultEmail,
          status: 'active',
          plan_type: 'enterprise'
        })
        .select('id')
        .maybeSingle()

      if (customerError || !newCustomer) {
        console.error('Failed to create customer:', customerError)
        return new Response(
          JSON.stringify({ error: 'Failed to create customer organization' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      customerId = newCustomer.id
      console.log(`Created new customer: ${customerId}`)
    }

    // Step 2: Ensure user profile exists and link to customer
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingProfile) {
      // Update existing profile
      if (!existingProfile.customer_id) {
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ customer_id: customerId })
          .eq('user_id', userId)

        if (updateError) {
          console.error('Failed to link user to customer:', updateError)
        } else {
          console.log(`Linked existing profile to customer`)
        }
      }
    } else {
      // Create profile if it doesn't exist (trigger may have failed)
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          customer_id: customerId
        })

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log(`Created user profile`)
    }

    // Step 3: Create employee onboarding record
    const fullEmail = `${emailUsername}@oberaconnect.com`
    const startDate = new Date().toISOString().split('T')[0]

    const { error: onboardingError } = await supabaseAdmin
      .from('employee_onboardings')
      .insert({
        customer_id: customerId,
        created_by: userId,
        employee_name: fullName,
        employee_email: fullEmail,
        department: 'general',
        job_title: 'Employee',
        start_date: startDate,
        status: 'not_started'
      })

    if (onboardingError) {
      console.error('Failed to create onboarding:', onboardingError)
      // Non-critical - continue
    } else {
      console.log(`Created onboarding record`)
    }

    // Step 4: Log audit event
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      customer_id: customerId,
      system_name: 'auth',
      action_type: 'signup_completed',
      action_details: {
        email: fullEmail,
        completed_at: new Date().toISOString()
      },
      compliance_tags: ['security', 'authentication']
    })

    console.log(`Signup completed successfully for user: ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        customerId,
        message: 'User signup completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in complete-user-signup:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
