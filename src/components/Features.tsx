import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Workflow, BarChart3, Database, Users, FileCheck } from "lucide-react";
import complianceIcon from "@/assets/compliance-icon.png";
import workflowIcon from "@/assets/workflow-icon.png";
import dashboardIcon from "@/assets/dashboard-icon.png";

const features = [
  {
    icon: complianceIcon,
    title: "Clause-Linked Schema Engine",
    description: "Every data point, workflow, and system is tagged to compliance clauses and operational metrics. Map ERP transactions, HRIS changes, CRM activities—all traced to requirements.",
    highlights: ["ISO 27001", "SOC 2", "HIPAA", "NIST", "Custom Tags"],
  },
  {
    icon: workflowIcon,
    title: "Cross-System Automation",
    description: "Unify workflows across ERP, HRIS, ATS, LMS, CRM, ITSM, and more. Trigger actions, sync data, and maintain compliance automatically as processes execute.",
    highlights: ["ERP Integration", "HRIS Sync", "ITSM Workflows", "CRM Automation"],
  },
  {
    icon: dashboardIcon,
    title: "Unified Intelligence Dashboards",
    description: "Role-based views across all systems—executives see KPIs and risk, ops teams track workflows, compliance officers monitor controls, auditors review evidence.",
    highlights: ["Executive KPIs", "Ops Metrics", "Compliance Score", "Audit Trail"],
  },
];

const additionalFeatures = [
  {
    icon: Database,
    title: "System-Wide Evidence Trail",
    description: "Every transaction, workflow step, and approval has traceable lineage with compliance tagging.",
  },
  {
    icon: Users,
    title: "Continuous Assessment",
    description: "Monitor health, performance, and compliance across your entire tech stack in real-time.",
  },
  {
    icon: FileCheck,
    title: "Operational Analytics",
    description: "Track compliance scores, process efficiency, resource utilization, and risk indicators unified.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Built for Scale, Designed for Simplicity
          </h2>
          <p className="text-xl text-muted-foreground">
            A unified operational backbone that integrates all your business systems—ERP, HRIS, CRM, ITSM, SCM, and more—with compliance tagging built into every schema layer.
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
