/**
 * Centralized configuration for Client Portal
 * Eliminates hardcoded arrays and magic strings
 */

export interface TicketCategory {
  value: string;
  label: string;
}

export interface TicketPriority {
  value: string;
  label: string;
}

export interface Dashboard {
  name: string;
  path: string;
}

// Ticket categories
export const ticketCategories: TicketCategory[] = [
  { value: "general", label: "General Support" },
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing" },
  { value: "feature_request", label: "Feature Request" },
];

// Priority levels
export const priorityLevels: TicketPriority[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

// Available dashboards for navigation
export const clientPortalDashboards: Dashboard[] = [
  { name: "Admin Dashboard", path: "/admin" },
  { name: "Employee Portal", path: "/portal" },
  { name: "Analytics Portal", path: "/analytics" },
  { name: "Compliance Portal", path: "/compliance" },
  { name: "Change Management", path: "/change-management" },
  { name: "Executive Dashboard", path: "/dashboard/executive" },
  { name: "Finance Dashboard", path: "/dashboard/finance" },
  { name: "HR Dashboard", path: "/dashboard/hr" },
  { name: "IT Dashboard", path: "/dashboard/it" },
  { name: "Operations Dashboard", path: "/dashboard/operations" },
  { name: "Sales Dashboard", path: "/dashboard/sales" },
  { name: "SOC Dashboard", path: "/dashboard/soc" },
];

// Default ticket values
export const defaultTicketValues = {
  subject: "",
  description: "",
  priority: "medium",
  category: "general",
};
