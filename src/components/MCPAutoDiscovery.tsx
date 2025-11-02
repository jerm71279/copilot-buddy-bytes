import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DiscoveredServer {
  id: string;
  endpoint_url: string;
  server_name: string;
  provider: string;
  discovered_at: string;
  last_seen_at: string;
  capabilities: string[];
  tools: Array<{ tool_name: string; description: string }>;
  response_time_ms: number;
  status: string;
  is_installed: boolean;
}

export function MCPAutoDiscovery({ customerId }: { customerId: string }) {
  const [discoveredServers, setDiscoveredServers] = useState<DiscoveredServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [endpoints, setEndpoints] = useState("");
  const [commonEndpoints, setCommonEndpoints] = useState<string[]>([
    "https://api.github.com/mcp",
    "https://{your-domain}.atlassian.net/rest/api/3",
    "https://{instance}.service-now.com/api/now",
    "https://api.slack.com/mcp",
  ]);

  useEffect(() => {
    fetchDiscoveredServers();
  }, [customerId]);

  const fetchDiscoveredServers = async () => {
    try {
      const { data, error } = await supabase
        .from('mcp_discovered_servers')
        .select('*')
        .eq('customer_id', customerId)
        .order('discovered_at', { ascending: false });

      if (error) throw error;
      
      // Type cast database Json types to expected types
      const typedData = (data || []).map(server => ({
        ...server,
        capabilities: (server.capabilities as any) || [],
        tools: (server.tools as any) || [],
        metadata: (server.metadata as any) || {}
      }));
      
      setDiscoveredServers(typedData as DiscoveredServer[]);
    } catch (error) {
      console.error('Error fetching discovered servers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startDiscovery = async () => {
    const endpointList = endpoints
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (endpointList.length === 0) {
      toast.error("Please enter at least one endpoint URL");
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('mcp-discovery', {
        body: {
          customer_id: customerId,
          endpoints: endpointList,
          scan_type: 'manual'
        }
      });

      if (error) throw error;

      toast.success(
        `Scan complete! Found ${data.servers_found} MCP server(s) from ${data.endpoints_scanned} endpoint(s)`
      );

      setEndpoints("");
      await fetchDiscoveredServers();
    } catch (error: any) {
      console.error('Discovery error:', error);
      toast.error(error.message || 'Failed to scan endpoints');
    } finally {
      setIsScanning(false);
    }
  };

  const installServer = async (server: DiscoveredServer) => {
    try {
      // Create MCP server from discovered server
      const { data: mcpServer, error: serverError } = await supabase
        .from('mcp_servers')
        .insert({
          customer_id: customerId,
          server_name: server.server_name,
          description: `Auto-discovered from ${server.provider}`,
          server_type: 'api',
          endpoint_url: server.endpoint_url,
          capabilities: server.capabilities,
          status: 'active',
          config: {
            provider: server.provider,
            from_discovery: true,
            discovered_at: server.discovered_at
          }
        })
        .select()
        .maybeSingle();

      if (serverError || !mcpServer) throw serverError;

      // Create tools
      if (server.tools.length > 0) {
        const toolsToInsert = server.tools.map(tool => ({
          server_id: mcpServer.id,
          tool_name: tool.tool_name,
          description: tool.description,
          input_schema: { type: 'object', properties: {} },
          is_enabled: true
        }));

        await supabase.from('mcp_tools').insert(toolsToInsert);
      }

      // Mark as installed
      await supabase
        .from('mcp_discovered_servers')
        .update({ is_installed: true, status: 'installed' })
        .eq('id', server.id);

      toast.success(`${server.server_name} installed successfully!`);
      await fetchDiscoveredServers();
    } catch (error: any) {
      console.error('Installation error:', error);
      toast.error(error.message || 'Failed to install server');
    }
  };

  const quickScanCommon = async () => {
    setEndpoints(commonEndpoints.join('\n'));
    toast.info("Common endpoints loaded. Click 'Start Discovery' to scan.");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'installed': return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading discovered servers...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Discovery Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Auto-Discovery Scanner
          </CardTitle>
          <CardDescription>
            Automatically discover MCP protocol servers on your network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoints">Endpoints to Scan (one per line)</Label>
            <Textarea
              id="endpoints"
              placeholder="https://api.example.com/mcp
https://server.domain.com/mcp
https://{your-instance}.service-now.com/api/now"
              value={endpoints}
              onChange={(e) => setEndpoints(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter endpoint URLs to scan for MCP protocol servers
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={startDiscovery}
              disabled={isScanning}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Start Discovery
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={quickScanCommon}
              disabled={isScanning}
            >
              Quick Scan Common
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discovered Servers */}
      <Card>
        <CardHeader>
          <CardTitle>Discovered Servers ({discoveredServers.length})</CardTitle>
          <CardDescription>
            MCP servers found through auto-discovery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {discoveredServers.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No servers discovered yet. Start a discovery scan to find MCP servers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {discoveredServers.map(server => (
                <Card key={server.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(server.status)}
                          <h3 className="font-semibold">{server.server_name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {server.endpoint_url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{server.provider}</Badge>
                        {server.is_installed && (
                          <Badge variant="default">Installed</Badge>
                        )}
                      </div>
                    </div>

                    {server.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {server.capabilities.slice(0, 5).map((cap, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                        {server.capabilities.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{server.capabilities.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Response Time</p>
                        <p className="font-semibold">{server.response_time_ms}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tools Found</p>
                        <p className="font-semibold">{server.tools.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Seen</p>
                        <p className="font-semibold">
                          {new Date(server.last_seen_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {!server.is_installed && (
                      <Button
                        size="sm"
                        onClick={() => installServer(server)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Install Server
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
