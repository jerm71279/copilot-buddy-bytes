import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bug, Code } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ToolCard } from "@/components/devops/ToolCard";
import { DocumentationCard } from "@/components/devops/DocumentationCard";
import { testingTools, developmentTools, documentationResources } from "@/lib/devopsConfig";

const DevOpsPortal = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-56 pb-8">
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
            {testingTools.map((tool) => (
              <ToolCard key={tool.path} {...tool} colorClass={tool.color} />
            ))}
          </div>
        </div>

        {/* Development Tools Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Code className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Development & Architecture Tools</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developmentTools.map((tool) => (
              <ToolCard key={tool.path} {...tool} colorClass={tool.color} />
            ))}
          </div>
        </div>

        {/* Documentation Resources */}
        <Card className="mt-12 border-primary/20">
          <CardHeader>
            <CardTitle>DevOps Documentation</CardTitle>
            <CardDescription>Comprehensive guides for testing, validation, and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documentationResources.map((doc) => (
              <DocumentationCard key={doc.docKey} {...doc} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevOpsPortal;
