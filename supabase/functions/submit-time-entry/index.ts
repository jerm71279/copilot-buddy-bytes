import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();

    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    const projectId = String(requestData.project_id || '').slice(0, 100);
    const description = String(requestData.description || '').slice(0, 1000);
    const hours = Number(requestData.hours || 0);
    const activityType = String(requestData.activity_type || 'development').slice(0, 50);
    const entryDate = String(requestData.entry_date || '').slice(0, 10);

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (hours <= 0 || hours > 24) {
      return new Response(
        JSON.stringify({ error: 'hours must be between 0 and 24' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!entryDate) {
      return new Response(
        JSON.stringify({ error: 'entry_date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Submitting time entry for user:', user.id, 'project:', projectId, 'hours:', hours);

    // Insert time entry
    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        project_id: projectId,
        description,
        hours,
        activity_type: activityType,
        is_billable: requestData.is_billable !== false,
        billing_rate: requestData.billing_rate ? Number(requestData.billing_rate) : null,
        entry_date: entryDate,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error || !entry) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error ? error.message : 'Failed to create time entry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Time entry created:', entry.id);

    return new Response(
      JSON.stringify(entry),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
