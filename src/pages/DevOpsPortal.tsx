import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, TestTube, Database, Activity, Code, FileCheck, Network, Bug } from "lucide-react";
import Navigation from "@/components/Navigation";

const DevOpsPortal = () => {
  const navigate = useNavigate();

  const testingTools = [
    {
      title: "Link Validation Tool",
      description: "Comprehensive testing tool to validate all routes, buttons, and links across the entire application",
      icon: Bug,
      path: "/test/link-validation",
      color: "text-red-500"
    },
    {
      title: "Input Validation Testing",
      description: "Test input validation and sanitization for security vulnerabilities including SQL injection, XSS, and path traversal",
      icon: Shield,
      path: "/test/input-validation",
      color: "text-blue-500"
    },
    {
      title: "System Validation Dashboard",
      description: "Comprehensive system validation including database schema, RLS policies, edge functions, and UI components",
      icon: Database,
      path: "/test/validation",
      color: "text-green-500"
    },
    {
      title: "Comprehensive Test Dashboard",
      description: "Advanced testing with test data generation, security fuzz testing, and database flow tracing",
      icon: TestTube,
      path: "/test/comprehensive",
      color: "text-purple-500"
    },
    {
      title: "Network Monitoring",
      description: "Monitor network devices, SNMP metrics, syslog events, and device health status",
      icon: Network,
      path: "/network-monitoring",
      color: "text-orange-500"
    },
    {
      title: "Workflow Evidence Testing",
      description: "Test automated evidence generation and workflow compliance tracking",
      icon: FileCheck,
      path: "/test/workflow-evidence",
      color: "text-indigo-500"
    }
  ];

  const developmentTools = [
    {
      title: "Architecture Canvas",
      description: "Visual system architecture diagram with component relationships and data flows",
      icon: Code,
      path: "/architecture/canvas",
      color: "text-cyan-500"
    },
    {
      title: "Data Flow Portal",
      description: "Visualize data flows across CMDB, CIPP, Compliance, Change Management, and Workflows",
      icon: Activity,
      path: "/data-flow",
      color: "text-pink-500"
    },
    {
      title: "MCP Server Dashboard",
      description: "Manage and monitor Model Context Protocol servers and execution logs",
      icon: Activity,
      path: "/mcp-servers",
      color: "text-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            DevOps Portal
          </h1>
          <p className="text-muted-foreground text-lg">
            Centralized hub for testing, validation, and development tools
          </p>
        </div>

        {/* Testing Tools Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Bug className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Testing & Validation Tools</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testingTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card 
                  key={tool.path}
                  className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer group"
                  onClick={() => navigate(tool.path)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className={`h-10 w-10 ${tool.color} mb-2 group-hover:scale-110 transition-transform`} />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {tool.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(tool.path);
                      }}
                    >
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Development Tools Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Code className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Development & Architecture Tools</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developmentTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card 
                  key={tool.path}
                  className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer group"
                  onClick={() => navigate(tool.path)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className={`h-10 w-10 ${tool.color} mb-2 group-hover:scale-110 transition-transform`} />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {tool.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(tool.path);
                      }}
                    >
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Documentation Resources */}
        <Card className="mt-12 border-primary/20">
          <CardHeader>
            <CardTitle>DevOps Documentation</CardTitle>
            <CardDescription>Comprehensive guides for testing, validation, and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Testing Guide (TESTING_GUIDE.md)</h4>
                <p className="text-sm text-muted-foreground">
                  Complete framework covering system validation, comprehensive testing, security measures, performance benchmarks, and CI/CD integration
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/docs?doc=TESTING_GUIDE')}
              >
                View
              </Button>
            </div>
            
            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Testing Procedures (TESTING_PROCEDURES.md)</h4>
                <p className="text-sm text-muted-foreground">
                  Detailed step-by-step procedures for Phase 1-6 testing including Two-Tier Feedback Loop, Core Platform Features, Integration Testing, Security, Performance, and UAT
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/docs?doc=TESTING_PROCEDURES')}
              >
                View
              </Button>
            </div>
            
            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Input Validation Guide (INPUT_VALIDATION_GUIDE.md)</h4>
                <p className="text-sm text-muted-foreground">
                  Multi-layered validation approach covering client-side, component-level, edge function, and database validation to prevent SQL injection, XSS, and other attacks
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/docs?doc=INPUT_VALIDATION_GUIDE')}
              >
                View
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Debug Procedures (DEBUG_PROCEDURES.md)</h4>
                <p className="text-sm text-muted-foreground">
                  Systematic debugging approach for edge functions, database queries, RLS policies, and common integration issues
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/docs?doc=DEBUG_PROCEDURES')}
              >
                View
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Security Audit Report (SECURITY_AUDIT_REPORT.md)</h4>
                <p className="text-sm text-muted-foreground">
                  Comprehensive security audit covering authentication, data protection, input validation, RLS policies, and compliance requirements
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/docs?doc=SECURITY_AUDIT_REPORT')}
              >
                View
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Architecture Documentation (ARCHITECTURE.md)</h4>
                <p className="text-sm text-muted-foreground">
                  System architecture overview including frontend/backend structure, database schema, integrations, and data flow patterns
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/docs?doc=ARCHITECTURE')}
              >
                View
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">API Reference (API_REFERENCE.md)</h4>
                <p className="text-sm text-muted-foreground">
                  Complete API documentation for all edge functions including authentication, parameters, responses, and error handling
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/docs?doc=API_REFERENCE')}
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevOpsPortal;
