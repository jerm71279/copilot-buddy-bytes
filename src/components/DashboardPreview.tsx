import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const DashboardPreview = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Unified Operational Intelligence
          </h2>
          <p className="text-xl text-muted-foreground">
            Monitor compliance, operations, and system health across your entire business tech stack. 
            Track ERP workflows, HRIS processes, CRM activities, and compliance controls from one unified dashboard.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Compliance Score */}
          <Card className="border-border shadow-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Compliance Score</CardTitle>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <CardDescription>Overall compliance posture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-success mb-4">94%</div>
              <Progress value={94} className="h-3 mb-3" />
              <p className="text-sm text-muted-foreground">
                +12% from last quarter
              </p>
            </CardContent>
          </Card>

          {/* Active Controls */}
          <Card className="border-border shadow-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Active Controls</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              <CardDescription>Implemented & monitored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-accent mb-4">247</div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  203 Compliant
                </Badge>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  44 Review
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Open Items */}
          <Card className="border-border shadow-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Action Items</CardTitle>
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <CardDescription>Requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-warning mb-4">12</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">High Priority</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Medium Priority</span>
                  <span className="font-semibold">9</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Framework Breakdown */}
        <Card className="border-border shadow-elevated">
          <CardHeader>
            <CardTitle className="text-xl">Framework Compliance Breakdown</CardTitle>
            <CardDescription>
              Status across all supported compliance frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: "ISO 27001", score: 96, total: 114, color: "bg-blue-500" },
                { name: "SOC 2 Type II", score: 92, total: 64, color: "bg-purple-500" },
                { name: "HIPAA", score: 95, total: 48, color: "bg-green-500" },
                { name: "NIST CSF", score: 89, total: 108, color: "bg-orange-500" },
              ].map((framework, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${framework.color}`} />
                      <span className="font-semibold">{framework.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {Math.round((framework.score / 100) * framework.total)}/{framework.total} controls
                      </span>
                      <span className="font-semibold text-lg">{framework.score}%</span>
                    </div>
                  </div>
                  <Progress value={framework.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DashboardPreview;
