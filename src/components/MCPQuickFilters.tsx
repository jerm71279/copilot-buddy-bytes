import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Link, 
  Unlink,
  TrendingUp,
  Zap
} from "lucide-react";
import { ServerFilters } from "./MCPServerFilters";

interface QuickFilter {
  id: string;
  name: string;
  icon: any;
  description: string;
  filters: Partial<ServerFilters>;
}

const quickFilters: QuickFilter[] = [
  {
    id: "needs-attention",
    name: "Needs Attention",
    icon: AlertCircle,
    description: "Inactive or error servers",
    filters: {
      status: ["inactive", "error"],
    },
  },
  {
    id: "active-only",
    name: "Active Only",
    icon: CheckCircle,
    description: "Only active servers",
    filters: {
      status: ["active"],
    },
  },
  {
    id: "no-endpoint",
    name: "No Endpoint",
    icon: Unlink,
    description: "Servers without endpoint configured",
    filters: {
      hasEndpoint: false,
    },
  },
  {
    id: "configured",
    name: "Fully Configured",
    icon: Link,
    description: "Active servers with endpoints",
    filters: {
      status: ["active"],
      hasEndpoint: true,
    },
  },
  {
    id: "recent",
    name: "Recently Added",
    icon: Clock,
    description: "Servers added in last 7 days",
    filters: {
      // Will be handled by date filter when implemented
    },
  },
  {
    id: "production",
    name: "Production",
    icon: Zap,
    description: "Production environment servers",
    filters: {
      tags: ["production"],
    },
  },
];

interface MCPQuickFiltersProps {
  onApplyFilter: (filters: Partial<ServerFilters>) => void;
  currentFilters: ServerFilters;
}

export function MCPQuickFilters({ onApplyFilter, currentFilters }: MCPQuickFiltersProps) {
  const isFilterActive = (quickFilter: QuickFilter): boolean => {
    // Check if this quick filter's settings match current filters
    const { filters } = quickFilter;
    
    if (filters.status && filters.status.length > 0) {
      const hasAllStatuses = filters.status.every(s => currentFilters.status.includes(s));
      if (!hasAllStatuses) return false;
    }
    
    if (filters.hasEndpoint !== undefined && filters.hasEndpoint !== currentFilters.hasEndpoint) {
      return false;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(t => currentFilters.tags.includes(t));
      if (!hasAllTags) return false;
    }
    
    return true;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => {
        const Icon = filter.icon;
        const active = isFilterActive(filter);
        
        return (
          <Button
            key={filter.id}
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => onApplyFilter(filter.filters)}
            className="gap-2"
            title={filter.description}
          >
            <Icon className="h-4 w-4" />
            {filter.name}
          </Button>
        );
      })}
    </div>
  );
}
