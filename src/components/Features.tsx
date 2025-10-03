import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Workflow, BarChart3, Database, Users, FileCheck } from "lucide-react";
import complianceIcon from "@/assets/compliance-icon.png";
import workflowIcon from "@/assets/workflow-icon.png";
import dashboardIcon from "@/assets/dashboard-icon.png";

const features = [
  {
    icon: complianceIcon,
    title: "ML-Powered Predictive Intelligence",
    description: "Machine learning models analyze patterns across all connected systems to predict problems before they occur. Forecast staffing needs, cash flow issues, compliance risks, and operational bottlenecks with increasing accuracy as more systems connect.",
    highlights: ["Predictive Analytics", "Risk Forecasting", "Anomaly Detection", "Pattern Recognition", "Smart Alerts"],
  },
  {
    icon: workflowIcon,
    title: "AI-Driven Workflow Optimization",
    description: "AI automatically identifies inefficiencies and recommends optimizations across ERP, HRIS, CRM, ITSM, and SCM. The system learns from every workflow execution to continuously improve automation and eliminate redundancies.",
    highlights: ["Auto-Optimization", "Smart Recommendations", "Learning Algorithms", "Resource Allocation"],
  },
  {
    icon: dashboardIcon,
    title: "Intelligent Operational Dashboards",
    description: "Real-time ML-powered insights into KPIs, efficiency trends, and compliance risks. The more systems you connect, the better the predictions and recommendations become—creating a powerful network effect.",
    highlights: ["Predictive KPIs", "Trend Analysis", "Risk Scoring", "Cross-System Insights"],
  },
];

const additionalFeatures = [
  {
    icon: Database,
    title: "The Network Effect",
    description: "More systems connected means better ML models. Start with 3 systems, get basic automation. Connect 10+ systems, unlock predictive intelligence that transforms operations.",
  },
  {
    icon: Users,
    title: "Continuous Learning",
    description: "Our ML models improve with every transaction, workflow, and data point. The platform gets smarter over time, delivering increasingly accurate predictions and recommendations.",
  },
  {
    icon: FileCheck,
    title: "Cross-System Intelligence",
    description: "Discover insights impossible to see in isolated systems. Connect ERP + HRIS to predict staffing. Add CRM + Finance to forecast cash flow. More connections = exponentially better insights.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            More Data. Smarter Insights. Better Decisions.
          </h2>
          <p className="text-xl text-muted-foreground">
            Our ML-powered platform learns from every system you connect. The more data flowing in from ERP, HRIS, CRM, ITSM, and SCM, 
            the better we predict problems, recommend solutions, and optimize your operations—all while maintaining continuous compliance.
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
