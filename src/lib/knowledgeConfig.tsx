import { 
  FileText, BookOpen, Lightbulb, Award, BookMarked, 
  Sparkles, Plus, Upload, Cloud, Download, Brain 
} from "lucide-react";

/**
 * Knowledge Base Configuration
 * Centralized configuration for icons, colors, and utilities
 */

// Article type icons
export const articleTypeIcons = {
  policy: <Award className="h-4 w-4" />,
  best_practice: <BookMarked className="h-4 w-4" />,
  innovation: <Sparkles className="h-4 w-4" />,
  lesson_learned: <Lightbulb className="h-4 w-4" />,
  sop: <FileText className="h-4 w-4" />,
  guide: <BookOpen className="h-4 w-4" />,
  faq: <Lightbulb className="h-4 w-4" />,
  default: <FileText className="h-4 w-4" />
};

// Article type badge colors (using semantic tokens)
export const articleTypeBadgeColors = {
  policy: "bg-primary/10 text-primary",
  best_practice: "bg-success/10 text-success",
  innovation: "bg-secondary/10 text-secondary",
  lesson_learned: "bg-warning/10 text-warning",
  sop: "bg-primary/10 text-primary",
  guide: "bg-secondary/10 text-secondary",
  faq: "bg-accent/10 text-accent",
  default: "bg-muted text-muted-foreground"
};

// Quick action buttons configuration
export const knowledgeActionButtons = [
  {
    label: "Ask AI Assistant",
    path: "/intelligent-assistant",
    icon: <Brain className="h-5 w-5" />,
    variant: "default" as const,
    size: "lg" as const
  },
  {
    label: "New Article",
    path: "/knowledge/new",
    icon: <Plus className="h-4 w-4" />,
    variant: "default" as const
  },
  {
    label: "Upload Files",
    path: "/knowledge/upload",
    icon: <Upload className="h-4 w-4" />,
    variant: "outline" as const
  },
  {
    label: "SharePoint Sync",
    path: "/sharepoint-sync",
    icon: <Cloud className="h-4 w-4" />,
    variant: "outline" as const
  },
  {
    label: "Slack Sync",
    path: "/slack-sync",
    icon: <Cloud className="h-4 w-4" />,
    variant: "outline" as const
  },
  {
    label: "Generate from Workflows",
    path: "/knowledge/generate",
    icon: <Lightbulb className="h-4 w-4" />,
    variant: "outline" as const
  },
  {
    label: "Export Documentation",
    path: "/documentation",
    icon: <Download className="h-4 w-4" />,
    variant: "outline" as const
  }
];

// Dashboard navigation links
export const knowledgeDashboardLinks = [
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
  { name: "SOC Dashboard", path: "/dashboard/soc" }
];

// Utility functions
export function getArticleIcon(type: string) {
  return articleTypeIcons[type as keyof typeof articleTypeIcons] || articleTypeIcons.default;
}

export function getArticleTypeColor(type: string) {
  return articleTypeBadgeColors[type as keyof typeof articleTypeBadgeColors] || articleTypeBadgeColors.default;
}

export function formatArticleType(type: string): string {
  return (type || 'article').replace('_', ' ').toUpperCase();
}
