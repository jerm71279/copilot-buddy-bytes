/**
 * Centralized MCP utilities for badge rendering and status handling
 * Eliminates duplicate status configuration across components
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

/**
 * Get status badge component for MCP server status
 */
export function getMCPServerStatusBadge(status: string) {
  const statusConfig = {
    active: { 
      variant: "default" as const, 
      icon: CheckCircle2, 
      color: "text-primary" 
    },
    inactive: { 
      variant: "secondary" as const, 
      icon: XCircle, 
      color: "text-muted-foreground" 
    },
    error: { 
      variant: "destructive" as const, 
      icon: XCircle, 
      color: "text-destructive" 
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {status}
    </Badge>
  );
}

/**
 * Get status badge component for MCP execution status
 */
export function getMCPExecutionStatusBadge(status: string) {
  if (status === "success") {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      Error
    </Badge>
  );
}

/**
 * Format MCP server capabilities for display
 */
export function formatMCPCapabilities(capabilities: any): string[] {
  if (!capabilities) return [];
  if (Array.isArray(capabilities)) return capabilities;
  if (typeof capabilities === 'string') {
    try {
      const parsed = JSON.parse(capabilities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Format tool name for display (replace underscores with spaces, capitalize)
 */
export function formatToolName(toolName: string): string {
  const words = toolName.split('_');
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Format server type for display
 */
export function formatServerType(serverType: string): string {
  const typeMap: Record<string, string> = {
    database: "Database Context",
    api: "API Integration",
    filesystem: "File System",
    analytics: "Analytics",
    custom: "Custom",
    compliance: "Compliance",
    executive: "Executive",
    finance: "Finance",
    hr: "Human Resources",
    it: "IT Operations",
    operations: "Operations",
    sales: "Sales",
    security: "Security"
  };
  
  return typeMap[serverType] || serverType;
}

/**
 * Calculate health score for MCP server based on execution logs
 */
export function calculateServerHealth(
  totalExecutions: number,
  successfulExecutions: number,
  avgExecutionTime: number | null
): number {
  if (totalExecutions === 0) return 100;
  
  let health = 100;
  
  // Success rate impact (up to -50 points)
  const successRate = successfulExecutions / totalExecutions;
  health -= (1 - successRate) * 50;
  
  // Performance impact (up to -25 points)
  if (avgExecutionTime && avgExecutionTime > 5000) {
    health -= 25;
  } else if (avgExecutionTime && avgExecutionTime > 2000) {
    health -= 10;
  }
  
  return Math.max(0, Math.round(health));
}
