import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, Server, Zap, Search } from "lucide-react";
import { toast } from "sonner";
import { useMCPServers, useMCPTools, executeMCPTool, MCPServer } from "@/hooks/useMCPServers";
import { getMCPServerStatusBadge, formatMCPCapabilities } from "@/lib/mcpUtils";
import { supabase } from "@/integrations/supabase/client";
import { MCPBulkOperations } from "./MCPBulkOperations";
import { MCPServerFilters, ServerFilters } from "./MCPServerFilters";
import { MCPQuickFilters } from "./MCPQuickFilters";
import { MCPFilterChips } from "./MCPFilterChips";
import { MCPSortOptions, SortOption } from "./MCPSortOptions";

type MCPServerStatusProps = { 
  customerId?: string;
  filterByServerType?: string;
};

export default function MCPServerStatus({ customerId, filterByServerType }: MCPServerStatusProps) {
  const { servers, isLoading, reload } = useMCPServers(filterByServerType);
  const { tools } = useMCPTools(servers.map(s => s.id));
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date-newest");
  const [groups, setGroups] = useState<Array<{ id: string; group_name: string; color: string }>>([]);
  const [filters, setFilters] = useState<ServerFilters>({
    status: [],
    groups: [],
    tags: [],
    serverType: [],
    hasEndpoint: null,
  });

  useEffect(() => {
    if (customerId) {
      fetchGroups();
    }
  }, [customerId]);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('mcp_server_groups')
      .select('id, group_name, color')
      .eq('customer_id', customerId);
    
    if (data) {
      setGroups(data);
    }
  };

  const testMCPTool = async (serverId: string, toolName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication required");
        return;
      }

      // Resolve customer_id: use prop if provided, else lookup from profile
      let resolvedCustomerId = customerId;

      if (!resolvedCustomerId) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("customer_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        resolvedCustomerId = profile?.customer_id || undefined;
      }

      if (!resolvedCustomerId) {
        toast.error("Customer profile not found");
        return;
      }

      toast.info(`Testing ${toolName}...`);

      const result = await executeMCPTool(serverId, toolName, resolvedCustomerId, session.user.id);

      if (result.success) {
        toast.success(`${toolName} executed successfully in ${result.execution_time_ms}ms`);
      } else {
        toast.error(`${toolName} failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error testing MCP tool:", error);
      toast.error("Failed to execute tool");
    }
  };

  const toggleServerSelection = (serverId: string) => {
    setSelectedServers(prev => 
      prev.includes(serverId) 
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

  const toggleAllServers = () => {
    if (selectedServers.length === sortedAndFilteredServers.length) {
      setSelectedServers([]);
    } else {
      setSelectedServers(sortedAndFilteredServers.map(s => s.id));
    }
  };

  const applyQuickFilter = (quickFilters: Partial<ServerFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...quickFilters,
      // Merge arrays properly
      status: quickFilters.status || prev.status,
      groups: quickFilters.groups || prev.groups,
      tags: quickFilters.tags || prev.tags,
      serverType: quickFilters.serverType || prev.serverType,
    }));
  };

  const removeFilter = (filterType: keyof ServerFilters, value?: string) => {
    setFilters(prev => {
      if (filterType === 'hasEndpoint') {
        return { ...prev, hasEndpoint: null };
      }
      
      if (value && Array.isArray(prev[filterType])) {
        return {
          ...prev,
          [filterType]: (prev[filterType] as string[]).filter(v => v !== value),
        };
      }
      
      return prev;
    });
  };

  // Filter servers by search query and advanced filters
  const filteredServers = servers.filter(server => {
    // Search query filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || (
      server.server_name.toLowerCase().includes(query) ||
      server.description?.toLowerCase().includes(query) ||
      server.server_type.toLowerCase().includes(query)
    );

    // Status filter
    const matchesStatus = filters.status.length === 0 || 
      filters.status.includes(server.status);

    // Group filter
    const matchesGroup = filters.groups.length === 0 || 
      (server.group_id && filters.groups.includes(server.group_id));

    // Server type filter
    const matchesType = filters.serverType.length === 0 || 
      filters.serverType.includes(server.server_type);

    // Tags filter
    const matchesTags = filters.tags.length === 0 || 
      (server.tags && Array.isArray(server.tags) && 
       filters.tags.some(tag => (server.tags as string[]).includes(tag)));

    // Endpoint filter
    const matchesEndpoint = filters.hasEndpoint === null || 
      (filters.hasEndpoint ? !!server.endpoint_url : !server.endpoint_url);

    return matchesSearch && matchesStatus && matchesGroup && 
           matchesType && matchesTags && matchesEndpoint;
  });

  // Sort servers
  const sortedAndFilteredServers = [...filteredServers].sort((a, b) => {
    switch (sortOption) {
      case "name-asc":
        return a.server_name.localeCompare(b.server_name);
      case "name-desc":
        return b.server_name.localeCompare(a.server_name);
      case "date-newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "date-oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "status-asc":
        const statusOrder = { active: 0, inactive: 1, error: 2 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 999) - 
               (statusOrder[b.status as keyof typeof statusOrder] || 999);
      case "status-desc":
        const statusOrderDesc = { error: 0, inactive: 1, active: 2 };
        return (statusOrderDesc[a.status as keyof typeof statusOrderDesc] || 999) - 
               (statusOrderDesc[b.status as keyof typeof statusOrderDesc] || 999);
      case "type-asc":
        return a.server_type.localeCompare(b.server_type);
      case "type-desc":
        return b.server_type.localeCompare(a.server_type);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            MCP Servers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading MCP servers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <MCPBulkOperations 
        selectedServers={selectedServers}
        onClearSelection={() => setSelectedServers([])}
        onRefresh={reload}
      />

      {/* Quick Filters */}
      <Card>
        <CardContent className="p-4">
          <MCPQuickFilters 
            onApplyFilter={applyQuickFilter}
            currentFilters={filters}
          />
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {customerId && (
        <MCPServerFilters
          customerId={customerId}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Active Filter Chips */}
      {customerId && (
        <MCPFilterChips
          filters={filters}
          groups={groups}
          onRemoveFilter={removeFilter}
        />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                MCP Servers
              </CardTitle>
              <CardDescription>
                Model Context Protocol servers connecting AI to your data
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {servers.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedServers.length === sortedAndFilteredServers.length && sortedAndFilteredServers.length > 0}
                      onCheckedChange={toggleAllServers}
                    />
                    <span className="text-sm text-muted-foreground">Select All</span>
                  </div>
                  <MCPSortOptions value={sortOption} onChange={setSortOption} />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {sortedAndFilteredServers.length} of {servers.length} servers</span>
          </div>
        </CardHeader>
        <CardContent>
          {servers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No MCP servers configured
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search servers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {sortedAndFilteredServers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No servers match your filters
                </div>
              ) : (
                sortedAndFilteredServers.map((server) => (
                  <Card key={server.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedServers.includes(server.id)}
                            onCheckedChange={() => toggleServerSelection(server.id)}
                          />
                          <Activity className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{server.server_name}</CardTitle>
                            <CardDescription className="text-sm">
                              {server.description}
                            </CardDescription>
                          </div>
                        </div>
                        {getMCPServerStatusBadge(server.status)}
                      </div>
                    </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Capabilities
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {formatMCPCapabilities(server.capabilities).map((cap: string) => (
                            <Badge key={cap} variant="outline">
                              {cap.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {tools[server.id] && tools[server.id].length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Available Tools</h4>
                          <div className="space-y-2">
                            {tools[server.id].map((tool) => (
                              <div
                                key={tool.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{tool.tool_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {tool.description}
                                  </p>
                                  {tool.execution_count > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Executed {tool.execution_count} times
                                      {tool.avg_execution_time_ms && 
                                        ` • Avg: ${tool.avg_execution_time_ms}ms`
                                      }
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => testMCPTool(server.id, tool.tool_name)}
                                >
                                  Test
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {server.last_health_check && (
                        <p className="text-xs text-muted-foreground">
                          Last health check:{" "}
                          {new Date(server.last_health_check).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}