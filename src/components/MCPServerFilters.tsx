import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Filter, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";

interface ServerGroup {
  id: string;
  group_name: string;
  color: string;
}

export interface ServerFilters {
  status: string[];
  groups: string[];
  tags: string[];
  serverType: string[];
  hasEndpoint: boolean | null;
}

interface MCPServerFiltersProps {
  customerId: string;
  filters: ServerFilters;
  onFiltersChange: (filters: ServerFilters) => void;
}

export function MCPServerFilters({ customerId, filters, onFiltersChange }: MCPServerFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchFilterOptions();
  }, [customerId]);

  const fetchFilterOptions = async () => {
    // Fetch groups
    const { data: groupsData } = await supabase
      .from('mcp_server_groups')
      .select('id, group_name, color')
      .eq('customer_id', customerId);

    if (groupsData) {
      setGroups(groupsData);
    }

    // Fetch unique tags and types from servers
    const { data: serversData } = await supabase
      .from('mcp_servers')
      .select('tags, server_type')
      .eq('customer_id', customerId);

    if (serversData) {
      // Extract unique tags
      const tagsSet = new Set<string>();
      serversData.forEach(server => {
        if (server.tags && Array.isArray(server.tags)) {
          server.tags.forEach((tag: string) => tagsSet.add(tag));
        }
      });
      setAvailableTags(Array.from(tagsSet).sort());

      // Extract unique server types
      const typesSet = new Set<string>();
      serversData.forEach(server => {
        if (server.server_type) {
          typesSet.add(server.server_type);
        }
      });
      setAvailableTypes(Array.from(typesSet).sort());
    }
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const toggleGroup = (groupId: string) => {
    const newGroups = filters.groups.includes(groupId)
      ? filters.groups.filter(g => g !== groupId)
      : [...filters.groups, groupId];
    onFiltersChange({ ...filters, groups: newGroups });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const toggleServerType = (type: string) => {
    const newTypes = filters.serverType.includes(type)
      ? filters.serverType.filter(t => t !== type)
      : [...filters.serverType, type];
    onFiltersChange({ ...filters, serverType: newTypes });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      groups: [],
      tags: [],
      serverType: [],
      hasEndpoint: null,
    });
  };

  const activeFilterCount = 
    filters.status.length + 
    filters.groups.length + 
    filters.tags.length + 
    filters.serverType.length +
    (filters.hasEndpoint !== null ? 1 : 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                <Filter className="h-4 w-4" />
                <span className="font-semibold">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount}</Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <CollapsibleContent className="space-y-4 mt-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Status</Label>
              <div className="flex flex-wrap gap-2">
                {['active', 'inactive', 'error'].map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <label
                      htmlFor={`status-${status}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                    >
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Groups Filter */}
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Groups</Label>
                <div className="flex flex-wrap gap-2">
                  {groups.map(group => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={filters.groups.includes(group.id)}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      <label
                        htmlFor={`group-${group.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.group_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Server Type Filter */}
            {availableTypes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Server Type</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.serverType.includes(type)}
                        onCheckedChange={() => toggleServerType(type)}
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Endpoint Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Endpoint Configuration</Label>
              <Select
                value={filters.hasEndpoint === null ? "all" : filters.hasEndpoint ? "configured" : "not_configured"}
                onValueChange={(value) => {
                  const newValue = value === "all" ? null : value === "configured";
                  onFiltersChange({ ...filters, hasEndpoint: newValue });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Servers</SelectItem>
                  <SelectItem value="configured">With Endpoint</SelectItem>
                  <SelectItem value="not_configured">Without Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
