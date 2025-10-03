import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Workflow, BarChart3, Database, Users, FileCheck } from "lucide-react";
import complianceIcon from "@/assets/compliance-icon.png";
import workflowIcon from "@/assets/workflow-icon.png";
import dashboardIcon from "@/assets/dashboard-icon.png";

const features = [
  {
    icon: complianceIcon,
    title: "Compliance Backbone",
    description: "Clause-linked schema engine with ISO, NIST, SOC2 mappings baked into every module. Immutable audit trails and risk registers.",
    highlights: ["ISO 27001", "SOC 2", "HIPAA", "NIST"],
  },
  {
    icon: workflowIcon,
    title: "Workflow Integration",
    description: "Modular adapters for HR, Finance, Legal, and Operations. Schema block templates that clone and customize per division.",
    highlights: ["HR Systems", "Finance Tools", "Legal Workflows", "Operations"],
  },
  {
    icon: dashboardIcon,
    title: "Business Intelligence",
    description: "Executive dashboards showing how compliance supports KPIs and strategic goals. Real-time compliance posture visualization.",
    highlights: ["Live Dashboards", "Audit Reports", "Risk Analytics", "Strategy Alignment"],
  },
];

const additionalFeatures = [
  {
    icon: Database,
    title: "Extensible Control Library",
    description: "Filter, link, and manage controls across any workflow with ease.",
  },
  {
    icon: Users,
    title: "Role-Based Views",
    description: "Customized interfaces for executives, analysts, and auditors.",
  },
  {
    icon: FileCheck,
    title: "Printable Exports",
    description: "Board-ready reports for meetings, audits, and investor decks.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Built for Modern Compliance
          </h2>
          <p className="text-xl text-muted-foreground">
            A layered architecture that adapts to your business while maintaining the highest standards of compliance.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:shadow-floating transition-all duration-300">
              <CardHeader>
                <div className="w-20 h-20 mb-4 rounded-xl bg-gradient-accent p-4 shadow-elevated">
                  <img 
                    src={feature.icon} 
                    alt={feature.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardTitle className="text-2xl mb-2">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {feature.highlights.map((highlight, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full font-medium"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border hover:border-accent/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
