import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, TestTube, Database, Activity, Code, FileCheck, Network, Bug } from "lucide-react";
import Navigation from "@/components/Navigation";

const DevOpsPortal = () => {
  const navigate = useNavigate();

  const testingTools = [
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
      path: "/architecture-canvas",
      color: "text-cyan-500"
    },
    {
      title: "Data Flow Portal",
      description: "Visualize data flows across CMDB, CIPP, Compliance, Change Management, and Workflows",
      icon: Activity,
      path: "/data-flow-portal",
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

        {/* Quick Stats */}
        <Card className="mt-12 border-primary/20">
          <CardHeader>
            <CardTitle>DevOps Resources</CardTitle>
            <CardDescription>Additional documentation and guides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Testing Guide</span>
              <Button variant="outline" size="sm">View Docs</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Testing Procedures</span>
              <Button variant="outline" size="sm">View Docs</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Input Validation Guide</span>
              <Button variant="outline" size="sm">View Docs</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevOpsPortal;
