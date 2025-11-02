import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ServerFilters } from "./MCPServerFilters";

interface MCPFilterChipsProps {
  filters: ServerFilters;
  groups: Array<{ id: string; group_name: string; color: string }>;
  onRemoveFilter: (filterType: keyof ServerFilters, value?: string) => void;
}

export function MCPFilterChips({ filters, groups, onRemoveFilter }: MCPFilterChipsProps) {
  const hasActiveFilters = 
    filters.status.length > 0 ||
    filters.groups.length > 0 ||
    filters.tags.length > 0 ||
    filters.serverType.length > 0 ||
    filters.hasEndpoint !== null;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      
      {/* Status chips */}
      {filters.status.map((status) => (
        <Badge
          key={`status-${status}`}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
        >
          <span className="capitalize">{status}</span>
          <X
            className="h-3 w-3 hover:bg-destructive/20 rounded"
            onClick={() => onRemoveFilter('status', status)}
          />
        </Badge>
      ))}

      {/* Group chips */}
      {filters.groups.map((groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return null;
        
        return (
          <Badge
            key={`group-${groupId}`}
            variant="secondary"
            className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <span>{group.group_name}</span>
            <X
              className="h-3 w-3 hover:bg-destructive/20 rounded"
              onClick={() => onRemoveFilter('groups', groupId)}
            />
          </Badge>
        );
      })}

      {/* Server Type chips */}
      {filters.serverType.map((type) => (
        <Badge
          key={`type-${type}`}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 capitalize"
        >
          {type}
          <X
            className="h-3 w-3 hover:bg-destructive/20 rounded"
            onClick={() => onRemoveFilter('serverType', type)}
          />
        </Badge>
      ))}

      {/* Tag chips */}
      {filters.tags.map((tag) => (
        <Badge
          key={`tag-${tag}`}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
        >
          #{tag}
          <X
            className="h-3 w-3 hover:bg-destructive/20 rounded"
            onClick={() => onRemoveFilter('tags', tag)}
          />
        </Badge>
      ))}

      {/* Endpoint filter chip */}
      {filters.hasEndpoint !== null && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
        >
          {filters.hasEndpoint ? 'With Endpoint' : 'No Endpoint'}
          <X
            className="h-3 w-3 hover:bg-destructive/20 rounded"
            onClick={() => onRemoveFilter('hasEndpoint')}
          />
        </Badge>
      )}
    </div>
  );
}
