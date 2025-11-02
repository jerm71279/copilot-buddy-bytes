import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveryRequest {
  customer_id: string;
  endpoints: string[]; // List of URLs to scan
  scan_type?: 'manual' | 'scheduled' | 'auto';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json() as DiscoveryRequest;
    const { customer_id, endpoints, scan_type = 'manual' } = requestBody;

    if (!customer_id || !endpoints || endpoints.length === 0) {
      return new Response(
        JSON.stringify({ error: 'customer_id and endpoints array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create scan record
    const { data: scan, error: scanError } = await supabaseClient
      .from('mcp_discovery_scans')
      .insert({
        customer_id,
        scan_type,
        endpoints_scanned: 0,
        servers_found: 0,
        status: 'running'
      })
      .select()
      .maybeSingle();

    if (scanError || !scan) {
      console.error('Failed to create scan record:', scanError);
      return new Response(
        JSON.stringify({ error: 'Failed to create scan record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Discover servers in parallel
    const discoveryResults = await Promise.allSettled(
      endpoints.map(endpoint => discoverMCPServer(endpoint, customer_id))
    );

    let serversFound = 0;
    const discovered: any[] = [];

    for (const result of discoveryResults) {
      if (result.status === 'fulfilled' && result.value) {
        const discoveryData = result.value;
        
        // Upsert discovered server
        const { data: server, error: upsertError } = await supabaseClient
          .from('mcp_discovered_servers')
          .upsert({
            customer_id,
            endpoint_url: discoveryData.endpoint_url,
            server_name: discoveryData.server_name,
            provider: discoveryData.provider,
            capabilities: discoveryData.capabilities,
            tools: discoveryData.tools,
            metadata: discoveryData.metadata,
            response_time_ms: discoveryData.response_time_ms,
            status: 'verified',
            last_seen_at: new Date().toISOString(),
            error_message: null
          }, {
            onConflict: 'customer_id,endpoint_url'
          })
          .select()
          .maybeSingle();

        if (!upsertError && server) {
          serversFound++;
          discovered.push(server);
        }
      } else if (result.status === 'rejected') {
        console.error('Discovery failed for endpoint:', result.reason);
      }
    }

    // Update scan record
    await supabaseClient
      .from('mcp_discovery_scans')
      .update({
        endpoints_scanned: endpoints.length,
        servers_found: serversFound,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', scan.id);

    return new Response(
      JSON.stringify({
        success: true,
        scan_id: scan.id,
        endpoints_scanned: endpoints.length,
        servers_found: serversFound,
        discovered_servers: discovered
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('MCP Discovery Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Discover MCP server at endpoint
 */
async function discoverMCPServer(
  endpoint: string,
  customer_id: string
): Promise<any | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const startTime = Date.now();

    // Try to list tools (MCP protocol discovery)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MCP-Version': '1.0',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method: 'tools/list',
        params: {}
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();

    // Handle JSON-RPC error
    if (result.error) {
      throw new Error(result.error.message || 'MCP protocol error');
    }

    // Extract server information
    const tools = Array.isArray(result.result) ? result.result : [];
    const capabilities = tools.map((t: any) => t.name || 'unknown');

    // Try to extract server name from response or endpoint
    let serverName = 'Discovered Server';
    try {
      const urlObj = new URL(endpoint);
      serverName = urlObj.hostname.split('.')[0] || serverName;
    } catch {
      serverName = endpoint.substring(0, 50);
    }

    // Try to detect provider from hostname
    let provider = 'Unknown';
    if (endpoint.includes('atlassian.net')) provider = 'Atlassian';
    else if (endpoint.includes('github.com')) provider = 'GitHub';
    else if (endpoint.includes('service-now.com')) provider = 'ServiceNow';
    else if (endpoint.includes('salesforce.com')) provider = 'Salesforce';
    else if (endpoint.includes('microsoft.com')) provider = 'Microsoft';

    return {
      endpoint_url: endpoint,
      server_name: serverName,
      provider,
      capabilities,
      tools: tools.map((t: any) => ({
        tool_name: t.name || 'unknown',
        description: t.description || '',
        input_schema: t.inputSchema || {}
      })),
      metadata: {
        protocol_version: result.jsonrpc || '2.0',
        discovered_by: 'auto-discovery'
      },
      response_time_ms: responseTime
    };

  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Discovery failed for ${endpoint}:`, error);
    return null;
  }
}
