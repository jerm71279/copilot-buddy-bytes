import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, BookOpen, Code2, Database, FileText, ExternalLink, Workflow, Shield, Zap, Network, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Developers = () => {
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [docContents, setDocContents] = useState<Record<string, string>>({});
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});

  const docs = [
    {
      title: "Architecture",
      description: "Complete system architecture and design patterns",
      icon: Database,
      file: "ARCHITECTURE.md",
      category: "Core",
      diagram: true
    },
    {
      title: "API Reference",
      description: "Full API documentation for all endpoints",
      icon: Code2,
      file: "API_REFERENCE.md",
      category: "Integration"
    },
    {
      title: "Component Library",
      description: "UI component documentation and usage",
      icon: FileText,
      file: "COMPONENT_LIBRARY.md",
      category: "Frontend"
    },
    {
      title: "Dashboard Data Flows",
      description: "Data flow diagrams for all dashboards",
      icon: Workflow,
      file: "DASHBOARD_DATA_FLOWS.md",
      category: "Architecture"
    },
    {
      title: "Testing Guide",
      description: "Testing procedures and validation",
      icon: Shield,
      file: "TESTING_GUIDE.md",
      category: "QA"
    },
    {
      title: "Platform Features",
      description: "Complete feature index and capabilities",
      icon: Zap,
      file: "PLATFORM_FEATURE_INDEX.md",
      category: "Reference"
    }
  ];

  const integrationDocs = [
    {
      title: "CIPP Integration",
      description: "Microsoft 365 tenant management integration",
      file: "CIPP_INTEGRATION_GUIDE.md"
    },
    {
      title: "Revio Integration",
      description: "Billing and revenue data integration",
      file: "REVIO_INTEGRATION_GUIDE.md"
    },
    {
      title: "Microsoft 365",
      description: "Calendar, email, and Teams integration",
      file: "MICROSOFT365_INTEGRATION.md"
    },
    {
      title: "CMDB & Change Management",
      description: "Configuration management database guide",
      file: "CMDB_CHANGE_MANAGEMENT_GUIDE.md"
    }
  ];

  const loadDocContent = async (filename: string) => {
    if (docContents[filename]) return;
    
    setLoadingDocs(prev => ({ ...prev, [filename]: true }));
    try {
      const response = await fetch(`/${filename}`);
      if (response.ok) {
        const content = await response.text();
        setDocContents(prev => ({ ...prev, [filename]: content }));
      }
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
    } finally {
      setLoadingDocs(prev => ({ ...prev, [filename]: false }));
    }
  };

  const toggleDoc = (filename: string) => {
    const isExpanding = !expandedDocs[filename];
    setExpandedDocs(prev => ({ ...prev, [filename]: isExpanding }));
    if (isExpanding) {
      loadDocContent(filename);
    }
  };

  const formatMarkdown = (text: string): string => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/```([\s\S]+?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      .replace(/^\* (.+)$/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.+)$/gim, '<li class="ml-4">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n\n/g, '<br /><br />')
      .replace(/\n/g, '<br />');
  };

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
              {docs.map((doc) => {
                const Icon = doc.icon;
                const isExpanded = expandedDocs[doc.file];
                const isLoading = loadingDocs[doc.file];
                
                return (
                  <Card key={doc.file} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Icon className="h-8 w-8 text-primary" />
                        <Badge variant="secondary">{doc.category}</Badge>
                      </div>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription>{doc.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Collapsible open={isExpanded} onOpenChange={() => toggleDoc(doc.file)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <FileText className="mr-2 h-4 w-4" />
                              {isExpanded ? "Hide" : "View"} Documentation
                              {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-4">
                            {isLoading ? (
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
                        {doc.diagram && (
                          <Link to="/architecture-diagram">
                            <Button variant="secondary" className="w-full">
                              <Network className="mr-2 h-4 w-4" />
                              View Full Diagram
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Integration Guides */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Code2 className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Integration Guides</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {integrationDocs.map((doc) => {
                const isExpanded = expandedDocs[doc.file];
                const isLoading = loadingDocs[doc.file];
                
                return (
                  <Card key={doc.file} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription>{doc.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Collapsible open={isExpanded} onOpenChange={() => toggleDoc(doc.file)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            {isExpanded ? "Hide" : "View"} Guide
                            {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          {isLoading ? (
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
                );
              })}
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
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Frontend</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• React 18</li>
                    <li>• TypeScript</li>
                    <li>• Vite</li>
                    <li>• Tailwind CSS</li>
                    <li>• shadcn/ui</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Backend</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Supabase</li>
                    <li>• PostgreSQL</li>
                    <li>• Edge Functions</li>
                    <li>• Row Level Security</li>
                    <li>• Real-time</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">State Management</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• TanStack Query</li>
                    <li>• React Router v6</li>
                    <li>• Custom Hooks</li>
                    <li>• Context API</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Integrations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Microsoft 365</li>
                    <li>• CIPP</li>
                    <li>• NinjaOne</li>
                    <li>• Revio</li>
                    <li>• Lovable AI</li>
                  </ul>
                </div>
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
