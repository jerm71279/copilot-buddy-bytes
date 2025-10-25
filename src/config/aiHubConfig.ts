import { LucideIcon, BookOpen, Workflow, Bot } from "lucide-react";

export interface AILevel {
  level: number;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  features: string[];
  path: string;
  buttonText: string;
  badge: string;
}

export const aiLevels: AILevel[] = [
  {
    level: 1,
    title: "Knowledge Chat",
    subtitle: "Self-Learning Intelligence Assistant",
    description: "AI assistant that learns from every interaction and generates insights automatically. Searches across all knowledge sources with 95% accuracy, eliminating 10-20 hours/month of manual maintenance. Industry-leading: <1% of MSP platforms have self-learning knowledge systems.",
    icon: BookOpen,
    color: "text-[hsl(var(--success))]",
    bgColor: "bg-[hsl(var(--success))]/10",
    features: [
      "Automatically creates articles from resolved tickets",
      "Natural language search across all sources",
      "Self-improving confidence scores",
      "95% answer accuracy on repeated questions",
      "Eliminates 10-20 hours/month manual KB work"
    ],
    path: "/intelligent-assistant",
    buttonText: "Open Knowledge Chat",
    badge: "Self-Learning"
  },
  {
    level: 2,
    title: "Workflow Intelligence",
    subtitle: "Live Database Analysis & Insights",
    description: "Real-time AI analysis of operational data to detect patterns, compliance gaps, and optimization opportunities. 80% reduction in compliance reporting time (40h → 8h/month). Market differentiator: No competitor offers live database AI analysis.",
    icon: Workflow,
    color: "text-primary",
    bgColor: "bg-primary/10",
    features: [
      "Natural language database queries",
      "Real-time compliance gap detection",
      "Automated anomaly detection with root cause",
      "80% reduction in compliance reporting time",
      "Predictive insights for capacity planning"
    ],
    path: "/workflow-intelligence",
    buttonText: "Launch Workflow Intelligence",
    badge: "Live Database"
  },
  {
    level: 3,
    title: "AI Assistants & Bots",
    subtitle: "Contextual Department Helpers",
    description: "Department-specific AI assistants embedded throughout platform. Each trained on department data with context-aware help. 40% faster task completion, 60% reduction in cross-department delays. Industry unique: Only platform with 8 specialized AI assistants.",
    icon: Bot,
    color: "text-[hsl(var(--warning))]",
    bgColor: "bg-[hsl(var(--warning))]/10",
    features: [
      "8 department-specific AI assistants",
      "Context-aware based on dashboard and role",
      "Smart prompt templates library",
      "40% faster task completion",
      "Tool calling for advanced analytics"
    ],
    path: "/portal",
    buttonText: "View Dashboards",
    badge: "Contextual"
  }
];
