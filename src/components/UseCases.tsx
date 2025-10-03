import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Heart, DollarSign, PackageCheck, Briefcase, Globe } from "lucide-react";

const useCases = [
  {
    icon: Heart,
    industry: "Healthcare",
    title: "Patient Onboarding & Data Security",
    description: "HIPAA-compliant workflows with automated consent logging, audit trails, and risk assessments for patient data handling.",
    frameworks: ["HIPAA", "ISO 27001"],
    features: ["Consent Management", "PHI Protection", "Audit Logs"],
  },
  {
    icon: DollarSign,
    industry: "Financial Services",
    title: "Loan Approval & SOX Controls",
    description: "Embedded compliance controls in approval workflows with risk scoring, escalation logic, and regulatory reporting.",
    frameworks: ["SOX", "PCI DSS", "SOC 2"],
    features: ["Risk Scoring", "Approval Chains", "Financial Controls"],
  },
  {
    icon: PackageCheck,
    industry: "Manufacturing",
    title: "Supplier Onboarding & Quality",
    description: "ISO 9001 clause mapping, supplier risk assessment, and audit readiness for quality management systems.",
    frameworks: ["ISO 9001", "ISO 27001"],
    features: ["Supplier Vetting", "Quality Controls", "Supply Chain Risk"],
  },
  {
    icon: Globe,
    industry: "SaaS Companies",
    title: "Feature Release & Change Management",
    description: "SOC 2 schema integration in CI/CD pipelines with risk registers, rollback procedures, and compliance gates.",
    frameworks: ["SOC 2", "ISO 27001"],
    features: ["Change Controls", "Release Gates", "Rollback Procedures"],
  },
  {
    icon: Briefcase,
    industry: "Professional Services",
    title: "Client Onboarding & Data Privacy",
    description: "GDPR-compliant client workflows with data processing agreements, consent tracking, and privacy impact assessments.",
    frameworks: ["GDPR", "ISO 27001"],
    features: ["DPA Management", "Privacy Controls", "Client Portals"],
  },
  {
    icon: Building2,
    industry: "Enterprise",
    title: "Multi-Department Compliance",
    description: "Cross-functional compliance orchestration for HR, Legal, Finance, and IT with unified audit trails and reporting.",
    frameworks: ["Multi-Framework"],
    features: ["Cross-Department", "Unified Reporting", "Policy Engine"],
  },
];

const UseCases = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Compliance Across Industries
          </h2>
          <p className="text-xl text-muted-foreground">
            See how leading organizations embed compliance into their workflows to solve real business problems.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card 
                key={index} 
                className="border-border hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {useCase.industry}
                    </span>
                  </div>
                  <CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {useCase.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Frameworks */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {useCase.frameworks.map((framework, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-accent/10 text-accent text-xs rounded font-medium"
                      >
                        {framework}
                      </span>
                    ))}
                  </div>
                  
                  {/* Key Features */}
                  <div className="border-t border-border pt-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      Key Features:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {useCase.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-muted-foreground"
                        >
                          {feature}
                          {idx < useCase.features.length - 1 && " • "}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
