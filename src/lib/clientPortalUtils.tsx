import { Badge } from "@/components/ui/badge";

/**
 * Centralized utility functions for Client Portal
 * Eliminates duplicate helper functions
 */

/**
 * Get priority badge variant
 */
export const getPriorityVariant = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "critical":
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

/**
 * Render priority badge with correct variant
 */
export const PriorityBadge = ({ priority }: { priority: string }) => (
  <Badge variant={getPriorityVariant(priority)}>
    {priority}
  </Badge>
);

/**
 * Format status text (replace underscores with spaces, capitalize)
 */
export const formatStatus = (status: string): string => {
  return status.replace(/_/g, " ");
};

/**
 * Format category text (replace underscores with spaces, capitalize)
 */
export const formatCategory = (category: string): string => {
  return category.replace(/_/g, " ");
};
