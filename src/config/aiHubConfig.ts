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
    subtitle: "Intelligent Knowledge Assistant",
    description: "Ask questions and get intelligent responses powered by your entire knowledge base. The system learns from every interaction and generates insights automatically.",
    icon: BookOpen,
    color: "text-[hsl(var(--success))]",
    bgColor: "bg-[hsl(var(--success))]/10",
    features: [
      "Searches across all knowledge articles",
      "Self-learning AI that improves over time",
      "Generates insights from conversations",
      "Creates new knowledge articles automatically",
      "Tracks learning metrics and confidence scores"
    ],
    path: "/intelligent-assistant",
    buttonText: "Open Knowledge Chat",
    badge: "Self-Learning"
  },
  {
    level: 2,
    title: "Workflow Intelligence",
    subtitle: "Business Process Analysis",
    description: "AI-powered analysis of your business processes, compliance status, and operational outcomes. Query your live database for real-time insights into workflows, changes, and anomalies.",
    icon: Workflow,
    color: "text-primary",
    bgColor: "bg-primary/10",
    features: [
      "Real-time workflow performance analysis",
      "Compliance gap detection and reporting",
      "Anomaly detection and pattern recognition",
      "Change request success rate tracking",
      "Maintains clause linkages to frameworks"
    ],
    path: "/workflow-intelligence",
    buttonText: "Launch Workflow Intelligence",
    badge: "Live Database"
  },
  {
    level: 3,
    title: "AI Assistant & Bots",
    subtitle: "Contextual Department Helpers",
    description: "Department-specific AI assistants embedded throughout the platform. Each assistant is trained on department-specific data and provides contextual help with smart prompts and analytics tools.",
    icon: Bot,
    color: "text-[hsl(var(--warning))]",
    bgColor: "bg-[hsl(var(--warning))]/10",
    features: [
      "Context-aware assistance per dashboard",
      "Smart prompt templates library",
      "Department-specific knowledge injection",
      "Tool calling for advanced analytics",
      "Integrated into 15+ dashboards"
    ],
    path: "/portal",
    buttonText: "View Dashboards",
    badge: "Contextual"
  }
];
