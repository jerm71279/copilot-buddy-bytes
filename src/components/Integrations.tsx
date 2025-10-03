import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Webhook, 
  Database, 
  Cloud, 
  Mail, 
  MessageSquare, 
  FileSpreadsheet,
  Lock,
  GitBranch,
  Users2,
  Building,
  CalendarCheck,
  FileText
} from "lucide-react";

const integrationCategories = [
  {
    category: "Security & Monitoring",
    icon: Lock,
    integrations: [
      { name: "CrowdStrike", logo: "🦅" },
      { name: "Splunk", logo: "🔍" },
      { name: "Datadog", logo: "🐶" },
      { name: "PagerDuty", logo: "📟" },
    ],
  },
  {
    category: "HR Systems",
    icon: Users2,
    integrations: [
      { name: "BambooHR", logo: "🎋" },
      { name: "Workday", logo: "💼" },
      { name: "Gusto", logo: "👥" },
      { name: "Rippling", logo: "🌊" },
    ],
  },
  {
    category: "Cloud Infrastructure",
    icon: Cloud,
    integrations: [
      { name: "AWS", logo: "☁️" },
      { name: "Azure", logo: "🔷" },
      { name: "GCP", logo: "🌐" },
      { name: "Kubernetes", logo: "⚓" },
    ],
  },
  {
    category: "Development Tools",
    icon: GitBranch,
    integrations: [
      { name: "GitHub", logo: "🐙" },
      { name: "GitLab", logo: "🦊" },
      { name: "Jira", logo: "📊" },
      { name: "Jenkins", logo: "🔧" },
    ],
  },
  {
    category: "Communication",
    icon: MessageSquare,
    integrations: [
      { name: "Slack", logo: "💬" },
      { name: "Microsoft Teams", logo: "👥" },
      { name: "Email (SMTP)", logo: "📧" },
      { name: "Zoom", logo: "📹" },
    ],
  },
  {
    category: "Business Systems",
    icon: Building,
    integrations: [
      { name: "Salesforce", logo: "☁️" },
      { name: "NetSuite", logo: "📈" },
      { name: "QuickBooks", logo: "💚" },
      { name: "SAP", logo: "🏢" },
    ],
  },
];

const apiFeatures = [
  {
    icon: Webhook,
    title: "RESTful API",
    description: "Complete API access to all platform features with comprehensive documentation.",
  },
  {
    icon: Database,
    title: "Data Sync",
    description: "Real-time bidirectional sync with your existing systems and databases.",
  },
  {
    icon: FileSpreadsheet,
    title: "Custom Workflows",
    description: "Build custom integrations with our workflow automation engine.",
  },
];

const Integrations = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Seamless Integrations
          </h2>
          <p className="text-xl text-muted-foreground">
            Connect ComplianceOS with your existing tech stack. API-first design for maximum flexibility.
          </p>
        </div>

        {/* Integration Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {integrationCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="border-border hover:shadow-elevated transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {category.integrations.map((integration, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border hover:border-accent/50 transition-colors"
                      >
                        <span className="text-2xl">{integration.logo}</span>
                        <span className="text-sm font-medium truncate">
                          {integration.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* API Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {apiFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border text-center">
                <CardHeader>
                  <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-accent flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* CTA Card */}
        <Card className="bg-gradient-hero border-0 text-white text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-white mb-2">
              Need a Custom Integration?
            </CardTitle>
            <CardDescription className="text-white/80 text-base">
              Our team can build custom adapters for your specific systems and workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Badge variant="outline" className="bg-white/10 border-white/30 text-white text-sm py-2 px-4">
                <FileText className="h-4 w-4 mr-2" />
                API Documentation
              </Badge>
              <Badge variant="outline" className="bg-white/10 border-white/30 text-white text-sm py-2 px-4">
                <CalendarCheck className="h-4 w-4 mr-2" />
                Schedule Integration Call
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Integrations;
