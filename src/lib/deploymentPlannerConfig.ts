export const PROJECT_STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" }
];

export const VIEW_MODE_OPTIONS = [
  { value: "month", label: "Month View" },
  { value: "quarter", label: "Quarter View" },
  { value: "year", label: "Year View" }
];

export type ViewMode = "month" | "quarter" | "year";

export const getDefaultNewProject = () => ({
  project_name: "",
  description: "",
  project_type: "internal",
  project_status: "planning"
});
