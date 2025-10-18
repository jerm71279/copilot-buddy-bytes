import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceUrl } = await req.json();
    
    // Validate input
    if (!instanceUrl || typeof instanceUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Instance URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('NINJAONE_CLIENT_ID');
    const clientSecret = Deno.env.get('NINJAONE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'NinjaOne credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing NinjaOne connection with instance:', instanceUrl);

    // Step 1: Get OAuth token
    const tokenUrl = `${instanceUrl}/ws/oauth/token`;
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'monitoring management'
    });

    console.log('Requesting OAuth token from:', tokenUrl);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', tokenResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with NinjaOne',
          details: `Status ${tokenResponse.status}: ${errorText}`,
          step: 'oauth_token'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          error: 'No access token received from NinjaOne',
          step: 'oauth_token'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully obtained access token');

    // Step 2: Test API call - get organizations
    const apiUrl = `${instanceUrl}/api/v2/organizations`;
    console.log('Testing API call to:', apiUrl);

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API call failed:', apiResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'API call failed',
          details: `Status ${apiResponse.status}: ${errorText}`,
          step: 'api_call',
          authenticated: true
        }),
        { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const organizations = await apiResponse.json();
    console.log(`Successfully retrieved ${organizations.length || 0} organizations`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'NinjaOne connection successful',
        organizationCount: organizations.length || 0,
        tokenExpiresIn: tokenData.expires_in,
        instanceUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error testing NinjaOne connection:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        step: 'unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
