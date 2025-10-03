import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

const frameworks = [
  {
    name: "ISO 27001",
    description: "Information Security Management",
    clauses: 114,
    status: "Fully Supported",
    color: "bg-blue-500",
  },
  {
    name: "SOC 2",
    description: "Service Organization Control",
    clauses: 64,
    status: "Fully Supported",
    color: "bg-purple-500",
  },
  {
    name: "HIPAA",
    description: "Health Insurance Portability",
    clauses: 48,
    status: "Fully Supported",
    color: "bg-green-500",
  },
  {
    name: "NIST CSF",
    description: "Cybersecurity Framework",
    clauses: 108,
    status: "Fully Supported",
    color: "bg-orange-500",
  },
];

const Frameworks = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Compliance Tagging Across All Systems
          </h2>
          <p className="text-xl text-muted-foreground">
            Comprehensive clause mappings embedded in your operational schema. Every ERP transaction, HRIS record, CRM activity, and workflow step is tagged to compliance requirements.
          </p>
        </div>

        {/* Frameworks Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {frameworks.map((framework, index) => (
            <Card key={index} className="border-border hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-3 h-3 rounded-full ${framework.color}`} />
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {framework.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{framework.name}</CardTitle>
                <CardDescription>{framework.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent mb-1">
                  {framework.clauses}
                </div>
                <div className="text-sm text-muted-foreground">
                  Mapped Clauses
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="bg-gradient-primary border-0 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Universal Schema Architecture</CardTitle>
            <CardDescription className="text-white/80 text-base">
              Compliance tagging built into every layer of your business operations. Map ERP financial controls to SOC 2, 
              HRIS access logs to ISO 27001, CRM data handling to GDPR, supply chain records to regulatory requirements—all 
              in one unified schema engine that maintains audit readiness across your entire tech stack.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {["GDPR", "PCI DSS", "FedRAMP", "ISO 9001", "Custom Frameworks", "Operational KPIs", "Process Controls"].map((tag, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Frameworks;
