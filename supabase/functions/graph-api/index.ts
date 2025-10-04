import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user's session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { endpoint, method = 'GET', body } = await req.json();

    // Get the user's Microsoft access token from their session
    const { data: sessionData } = await supabase.auth.getSession();
    const providerToken = user.user_metadata?.provider_token;

    if (!providerToken) {
      return new Response(
        JSON.stringify({ 
          error: 'No Microsoft access token found. Please sign in with Microsoft 365.' 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Making Graph API request to: ${endpoint}`);

    // Make the Graph API request
    const graphResponse = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text();
      console.error('Graph API error:', graphResponse.status, errorText);
      
      if (graphResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Microsoft token expired. Please sign in again.',
            code: 'TOKEN_EXPIRED'
          }), 
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`Graph API error: ${graphResponse.status} ${errorText}`);
    }

    const data = await graphResponse.json();

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in graph-api function:', error);
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
