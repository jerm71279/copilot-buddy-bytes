import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, BookOpen, Code2, ExternalLink, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useDevelopersData } from "@/hooks/useDevelopersData";
import { coreDocs, integrationDocs, formatMarkdown } from "@/lib/developersConfig";
import { DocumentationCard } from "@/components/developers/DocumentationCard";
import { ToolCard } from "@/components/developers/ToolCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

const Developers = () => {
  const { expandedDocs, docContents, loadingDocs, toggleDoc } = useDevelopersData();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Github className="h-3 w-3 mr-1" />
              Open Source
            </Badge>
            <h1 className="text-5xl font-bold mb-4">
              Developer Portal
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access the full codebase, documentation, and API references. Built with React, TypeScript, and Supabase.
            </p>
          </div>

          {/* GitHub Repository */}
          <Card className="mb-12 bg-gradient-to-br from-primary/5 to-accent/5 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Github className="h-6 w-6" />
                GitHub Repository
              </CardTitle>
              <CardDescription>
                View the complete source code, commit history, and contribute to the project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://github.com/yourusername/oberaconnect" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[250px]"
                >
                  <Button variant="default" size="lg" className="w-full">
                    <Github className="mr-2 h-5 w-5" />
                    View on GitHub
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a 
                  href="https://github.com/yourusername/oberaconnect/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[250px]"
                >
                  <Button variant="outline" size="lg" className="w-full">
                    <FileText className="mr-2 h-5 w-5" />
                    Issues & Bug Reports
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">64+</div>
                  <div className="text-sm text-muted-foreground">Pages</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">55+</div>
                  <div className="text-sm text-muted-foreground">Database Tables</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">17</div>
                  <div className="text-sm text-muted-foreground">Edge Functions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Documentation */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Core Documentation</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreDocs.map((doc) => (
                <DocumentationCard
                  key={doc.file}
                  doc={doc}
                  isExpanded={expandedDocs[doc.file]}
                  isLoading={loadingDocs[doc.file]}
                  content={docContents[doc.file]}
                  onToggle={() => toggleDoc(doc.file)}
                />
              ))}
            </div>
          </div>

          {/* Integration Guides */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Code2 className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Integration Guides</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {integrationDocs.map((doc) => (
                <Card key={doc.file} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Collapsible open={expandedDocs[doc.file]} onOpenChange={() => toggleDoc(doc.file)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <FileText className="mr-2 h-4 w-4" />
                          {expandedDocs[doc.file] ? "Hide" : "View"} Guide
                          {expandedDocs[doc.file] ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        {loadingDocs[doc.file] ? (
                          <div className="p-4 text-center text-muted-foreground">Loading...</div>
                        ) : docContents[doc.file] ? (
                          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(docContents[doc.file]) }}
                            />
                          </ScrollArea>
                        ) : null}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Technology Stack</CardTitle>
              <CardDescription>
                Modern, scalable architecture built on proven technologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ToolCard 
                  title="Frontend"
                  items={["React 18", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui"]}
                />
                <ToolCard 
                  title="Backend"
                  items={["Supabase", "PostgreSQL", "Edge Functions", "Row Level Security", "Real-time"]}
                />
                <ToolCard 
                  title="State Management"
                  items={["TanStack Query", "React Router v6", "Custom Hooks", "Context API"]}
                />
                <ToolCard 
                  title="Integrations"
                  items={["Microsoft 365", "CIPP", "NinjaOne", "Revio", "Lovable AI"]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Start</CardTitle>
              <CardDescription>
                Get the project running locally in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
                <div># Clone the repository</div>
                <div className="text-primary">git clone https://github.com/yourusername/oberaconnect.git</div>
                <div className="mt-4"># Install dependencies</div>
                <div className="text-primary">npm install</div>
                <div className="mt-4"># Set up environment variables</div>
                <div className="text-primary">cp .env.example .env</div>
                <div className="mt-4"># Run development server</div>
                <div className="text-primary">npm run dev</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Developers;
