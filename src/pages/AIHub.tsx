import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardNavigation from "@/components/DashboardNavigation";
import {
  Brain,
  MessageSquare,
  Workflow,
  Bot,
  Sparkles,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

const AIHub = () => {
  const navigate = useNavigate();

  const aiLevels = [
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-56 pb-8">
        <DashboardNavigation 
          title="AI Hub"
          dashboards={[
            { name: "Knowledge Chat", path: "/intelligent-assistant" },
            { name: "Workflow Intelligence", path: "/workflow-intelligence" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Analytics Portal", path: "/analytics" },
          ]}
        />

        {/* Header */}
        <div className="mb-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">AI Hub</h1>
            <Sparkles className="h-8 w-8 text-[hsl(var(--warning))]" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Access three powerful levels of AI assistance - from knowledge management to workflow intelligence to contextual department helpers
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Lightbulb className="h-3 w-3" />
              Powered by Lovable AI
            </Badge>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Self-Learning Systems
            </Badge>
          </div>
        </div>

        {/* AI Levels Grid */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-8">
          {aiLevels.map((level) => {
            const IconComponent = level.icon;
            return (
              <Card key={level.level} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`absolute top-0 right-0 w-32 h-32 ${level.bgColor} rounded-full blur-3xl opacity-20`} />
                
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-3 rounded-lg ${level.bgColor}`}>
                      <IconComponent className={`h-8 w-8 ${level.color}`} />
                    </div>
                    <Badge variant="secondary">{level.badge}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">Level {level.level}</span>
                    </div>
                    <CardTitle className="text-2xl">{level.title}</CardTitle>
                    <p className="text-sm font-medium text-primary">{level.subtitle}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {level.description}
                  </CardDescription>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Key Features:</p>
                    <ul className="space-y-1">
                      {level.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    onClick={() => navigate(level.path)} 
                    className="w-full"
                    variant={level.level === 2 ? "default" : "outline"}
                  >
                    {level.buttonText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Integration Info */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              How These Systems Work Together
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[hsl(var(--success))]">1</span>
                  </div>
                  <h3 className="font-semibold text-sm">Knowledge Foundation</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  The Knowledge Chat learns from all interactions, building a growing knowledge base that powers the other AI systems
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold text-sm">Process Intelligence</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Workflow Intelligence analyzes real-time data to provide actionable insights about your operations and compliance
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[hsl(var(--warning))]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[hsl(var(--warning))]">3</span>
                  </div>
                  <h3 className="font-semibold text-sm">Contextual Assistance</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Department AI Assistants use insights from levels 1 & 2 to provide targeted help where you work
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>💡 Pro Tip:</strong> Start with Level 1 to build your knowledge base, then use Level 2 for operational insights, 
                and access Level 3 assistants throughout your daily workflow for contextual help.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIHub;
