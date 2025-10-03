import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Users, 
  Shield,
  ArrowRight,
  Database,
  Zap,
  FileCheck
} from "lucide-react";

const CaseStudy = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">
            Featured Customer
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How OberaConnect Transformed Compliance into Strategy
          </h2>
          <p className="text-xl text-muted-foreground">
            From compliance bottleneck to competitive advantage: OberaConnect's journey with ComplianceOS
          </p>
        </div>

        {/* Hero Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="border-border text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-success mb-2">75%</div>
              <div className="text-sm text-muted-foreground">Time Saved on Audits</div>
            </CardContent>
          </Card>
          <Card className="border-border text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-accent mb-2">4</div>
              <div className="text-sm text-muted-foreground">Frameworks Managed</div>
            </CardContent>
          </Card>
          <Card className="border-border text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-warning mb-2">300+</div>
              <div className="text-sm text-muted-foreground">Controls Automated</div>
            </CardContent>
          </Card>
          <Card className="border-border text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Audit Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Challenge */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              The Challenge
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                OberaConnect, a rapidly growing technology services company, struggled with compliance 
                becoming a bottleneck. Their team spent weeks preparing for audits, manually collecting 
                evidence, and managing controls across ISO 27001, SOC 2, HIPAA, and NIST frameworks.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="h-3 w-3 text-destructive" />
                  </div>
                  <span>Audit preparation took 6-8 weeks per framework</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="h-3 w-3 text-destructive" />
                  </div>
                  <span>Siloed compliance across HR, Legal, IT, and Finance teams</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileCheck className="h-3 w-3 text-destructive" />
                  </div>
                  <span>Manual evidence collection and control tracking</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Solution */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              The Solution
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                By implementing ComplianceOS, OberaConnect transformed their compliance operations with 
                a modular, clause-aware backbone that integrated seamlessly with their existing workflows.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  </div>
                  <span>Automated evidence collection through schema blocks (IR.1, HR.8, FIN.3)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  </div>
                  <span>MCP Server for dynamic clause resolution and control mapping</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  </div>
                  <span>Integration with HRIS, SIEM, and ticketing systems</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Architecture Implementation */}
        <Card className="border-border mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Implementation Architecture</CardTitle>
            <CardDescription className="text-base">
              How OberaConnect leveraged ComplianceOS's layered architecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Database,
                  title: "Compliance Backbone",
                  description: "Clause-linked schema blocks with automated audit flags and flow logic",
                },
                {
                  icon: Zap,
                  title: "MCP Server",
                  description: "Dynamic clause resolution serving flows, flags, and mappings in real-time",
                },
                {
                  icon: TrendingUp,
                  title: "Viewer Layer",
                  description: "Role-based dashboards for executives, analysts, and auditors",
                },
                {
                  icon: Users,
                  title: "Orchestration Layer",
                  description: "Workflow automation triggering escalations and exports automatically",
                },
                {
                  icon: Shield,
                  title: "Integration Layer",
                  description: "Seamless connections to HRIS, SIEM, CRM, and ERP systems",
                },
                {
                  icon: FileCheck,
                  title: "Schema Blocks",
                  description: "Reusable modules (IR.1, HR.8, FIN.3) mapped to business processes",
                },
              ].map((layer, idx) => {
                const Icon = layer.icon;
                return (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">{layer.title}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {layer.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-primary border-0 text-white">
          <CardHeader>
            <CardTitle className="text-3xl text-white mb-2">
              Measurable Results
            </CardTitle>
            <CardDescription className="text-white/80 text-base">
              OberaConnect's transformation by the numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5" />
                  Operational Improvements
                </h4>
                <ul className="space-y-3">
                  {[
                    "Audit preparation reduced from 6-8 weeks to 1-2 weeks",
                    "Cross-team coordination improved with shared schema logic",
                    "Real-time compliance posture visibility for executives",
                    "Automated control evidence collection saving 40+ hours/month",
                  ].map((result, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/90">
                      <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                      <span>{result}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5" />
                  Strategic Benefits
                </h4>
                <ul className="space-y-3">
                  {[
                    "Compliance became a competitive differentiator in sales",
                    "Faster vendor onboarding with automated compliance checks",
                    "Proactive risk identification and remediation",
                    "Unified reporting across ISO 27001, SOC 2, HIPAA, and NIST",
                  ].map((result, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/90">
                      <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                      <span>{result}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Quote */}
            <div className="border-t border-white/20 pt-6">
              <blockquote className="text-xl italic text-white/95 mb-4">
                "ComplianceOS didn't just help us meet compliance requirements—it transformed how we 
                think about risk management and business strategy. We went from reactive compliance 
                to proactive resilience."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  JM
                </div>
                <div>
                  <div className="font-semibold text-white">Jeremy Morrison</div>
                  <div className="text-sm text-white/70">Chief Compliance Officer, OberaConnect</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="lg" className="text-lg px-8">
            See ComplianceOS in Action
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CaseStudy;
