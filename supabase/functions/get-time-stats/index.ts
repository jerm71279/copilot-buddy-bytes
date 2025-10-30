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

    const startDate = requestData.startDate ? String(requestData.startDate).slice(0, 10) : null;
    const endDate = requestData.endDate ? String(requestData.endDate).slice(0, 10) : null;

    if (!startDate) {
      return new Response(
        JSON.stringify({ error: 'startDate is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calculating time stats for user:', user.id, 'from', startDate, 'to', endDate);

    // Build query
    let query = supabase
      .from('time_entries')
      .select('hours, is_billable, billing_rate')
      .eq('user_id', user.id)
      .gte('entry_date', startDate);

    if (endDate) {
      query = query.lte('entry_date', endDate);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate statistics
    const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
    const billableHours = entries
      .filter((e) => e.is_billable)
      .reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
    const revenue = entries.reduce((sum, entry) => {
      if (entry.is_billable && entry.billing_rate) {
        return sum + Number(entry.hours || 0) * Number(entry.billing_rate);
      }
      return sum;
    }, 0);

    const stats = {
      totalHours,
      billableHours,
      revenue,
      entries: entries.length,
    };

    console.log('Calculated stats:', stats);

    return new Response(
      JSON.stringify(stats),
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
