import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

const DocumentationViewer = () => {
  const [searchParams] = useSearchParams();
  const doc = searchParams.get("doc");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const docTitles: Record<string, string> = {
    "TESTING_GUIDE": "Testing Guide",
    "TESTING_PROCEDURES": "Testing Procedures",
    "INPUT_VALIDATION_GUIDE": "Input Validation Guide",
    "DEBUG_PROCEDURES": "Debug Procedures",
    "SECURITY_AUDIT_REPORT": "Security Audit Report",
    "ARCHITECTURE": "Architecture Documentation",
    "API_REFERENCE": "API Reference",
  };

  const availableDocs = [
    { key: "TESTING_GUIDE", title: "Testing Guide", description: "System validation, comprehensive testing, and CI/CD integration" },
    { key: "TESTING_PROCEDURES", title: "Testing Procedures", description: "Step-by-step procedures for all testing phases" },
    { key: "INPUT_VALIDATION_GUIDE", title: "Input Validation Guide", description: "Multi-layered validation to prevent security vulnerabilities" },
    { key: "DEBUG_PROCEDURES", title: "Debug Procedures", description: "Debugging edge functions, database queries, and RLS policies" },
    { key: "SECURITY_AUDIT_REPORT", title: "Security Audit Report", description: "Comprehensive security audit and compliance requirements" },
    { key: "ARCHITECTURE", title: "Architecture Documentation", description: "System architecture and data flow patterns" },
    { key: "API_REFERENCE", title: "API Reference", description: "Complete edge function API documentation" },
  ];

  useEffect(() => {
    const loadDocument = async () => {
      if (!doc) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/${doc}.md`);
        if (!response.ok) {
          throw new Error(`Document not found: ${doc}`);
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [doc]);

  // Simple markdown to HTML conversion for basic formatting
  const formatMarkdown = (text: string): string => {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-6">$1</h1>')
      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm">$1</code>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4">$2</li>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex gap-2">
          {doc ? (
            <Link to="/docs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Docs List
              </Button>
            </Link>
          ) : (
            <Link to="/devops">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to DevOps Portal
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">
                  {doc ? docTitles[doc] || doc : "Documentation"}
                </CardTitle>
                {doc && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {doc}.md
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading documentation...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
                <p className="text-destructive font-medium mb-2">Error loading document</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  The requested documentation file may not be available in the public folder.
                </p>
              </div>
            )}

            {!loading && !error && content && (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
                />
              </ScrollArea>
            )}

            {!loading && !doc && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Available Documentation</h2>
                <div className="grid gap-4">
                  {availableDocs.map((docItem) => (
                    <Link
                      key={docItem.key}
                      to={`/docs?doc=${docItem.key}`}
                      className="block p-4 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold mb-1">{docItem.title}</h3>
                      <p className="text-sm text-muted-foreground">{docItem.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!loading && !error && !content && doc && (
              <div className="text-center py-12 text-muted-foreground">
                No content available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentationViewer;
