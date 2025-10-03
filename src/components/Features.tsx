import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Workflow, BarChart3, Database, Users, FileCheck } from "lucide-react";
import complianceIcon from "@/assets/compliance-icon.png";
import workflowIcon from "@/assets/workflow-icon.png";
import dashboardIcon from "@/assets/dashboard-icon.png";

const features = [
  {
    icon: complianceIcon,
    title: "Bottleneck Detection & Resolution",
    description: "Monitor workflows across all systems to identify delays, inefficiencies, and process breakdowns. Get actionable insights with clause-linked schema showing exactly where and why problems occur.",
    highlights: ["Process Analytics", "Delay Detection", "Root Cause Analysis", "Smart Alerts", "Auto-Resolution"],
  },
  {
    icon: workflowIcon,
    title: "Cross-System Workflow Optimization",
    description: "Unify and automate workflows across ERP, HRIS, ATS, LMS, CRM, ITSM. Eliminate redundancies, streamline approvals, and maintain compliance as operations execute.",
    highlights: ["Workflow Automation", "Smart Routing", "Approval Chains", "Data Sync"],
  },
  {
    icon: dashboardIcon,
    title: "Operational Intelligence Dashboards",
    description: "Real-time visibility into KPIs, efficiency metrics, bottlenecks, and compliance across all departments. Role-based views for executives, operations, compliance, and audit teams.",
    highlights: ["Real-Time KPIs", "Efficiency Metrics", "Bottleneck Alerts", "Audit Readiness"],
  },
];

const additionalFeatures = [
  {
    icon: Database,
    title: "Problem-Solving Intelligence",
    description: "AI-powered insights identify operational issues, recommend solutions, and automate fixes across your entire tech stack.",
  },
  {
    icon: Users,
    title: "Resource Optimization",
    description: "Track utilization, workload distribution, and capacity across teams and systems to eliminate waste and improve efficiency.",
  },
  {
    icon: FileCheck,
    title: "Compliance-First Analytics",
    description: "Every metric tied to compliance requirements—track scores, audit readiness, control effectiveness, and risk indicators unified.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Identify Problems. Optimize Workflows. Stay Compliant.
          </h2>
          <p className="text-xl text-muted-foreground">
            Our unified operational intelligence platform monitors all your systems—ERP, HRIS, CRM, ITSM, SCM—to surface 
            bottlenecks, automate solutions, and maintain continuous compliance with clause-tagged schema architecture.
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
