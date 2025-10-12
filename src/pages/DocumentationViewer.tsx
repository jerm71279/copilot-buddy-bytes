import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, CheckSquare, Square } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import html2pdf from "html2pdf.js";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";

const DocumentationViewer = () => {
  const [searchParams] = useSearchParams();
  const doc = searchParams.get("doc");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const exportToPDF = async () => {
    if (!contentRef.current || !content) return;

    setExporting(true);
    toast({
      title: "Generating PDF",
      description: "Please wait while we create your PDF...",
    });

    try {
      const element = contentRef.current;
      const opt = {
        margin: 1,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
      };

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const filename = `${doc || "documentation"}.pdf`;
      
      downloadBlob(pdfBlob, filename);
      
      toast({
        title: "PDF Exported",
        description: "Your documentation has been downloaded successfully.",
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // iOS: Open in new tab with proper MIME type
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${filename}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body { margin: 0; padding: 20px; font-family: system-ui; text-align: center; }
                  .download-btn { 
                    display: inline-block; 
                    padding: 12px 24px; 
                    background: #007AFF; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    margin: 20px 0;
                    font-size: 16px;
                  }
                  .info { color: #666; margin-top: 20px; }
                </style>
              </head>
              <body>
                <h2>${filename}</h2>
                <a href="${base64data}" download="${filename}" class="download-btn">
                  Download File
                </a>
                <p class="info">
                  Tap the button above to download, then you can save to Files or Google Drive
                </p>
              </body>
            </html>
          `);
        }
      };
      reader.readAsDataURL(blob);
    } else {
      // Standard download for other browsers
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const exportMultipleToPDF = async () => {
    if (selectedDocs.length === 0) return;

    setExporting(true);
    toast({
      title: "Generating PDFs",
      description: `Exporting ${selectedDocs.length} document(s)...`,
    });

    try {
      const zip = new JSZip();
      
      for (let i = 0; i < selectedDocs.length; i++) {
        const docKey = selectedDocs[i];
        
        toast({
          title: "Processing",
          description: `Generating PDF ${i + 1} of ${selectedDocs.length}...`,
        });

        const response = await fetch(`/${docKey}.md`);
        if (response.ok) {
          const text = await response.text();
          const docContent = document.createElement("div");
          docContent.style.position = "absolute";
          docContent.style.left = "-9999px";
          docContent.style.padding = "20px";
          docContent.style.backgroundColor = "white";
          docContent.style.color = "black";
          docContent.innerHTML = formatMarkdown(text);

          document.body.appendChild(docContent);

          const opt = {
            margin: 1,
            image: { type: "jpeg" as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
          };

          const pdfBlob = await html2pdf().set(opt).from(docContent).outputPdf('blob');
          const filename = `${docTitles[docKey] || docKey}.pdf`;
          zip.file(filename, pdfBlob);

          document.body.removeChild(docContent);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const filename = `Documentation-${new Date().toISOString().split('T')[0]}.zip`;
      
      downloadBlob(zipBlob, filename);
      
      toast({
        title: "ZIP Exported",
        description: `Successfully exported ${selectedDocs.length} document(s) as separate PDFs.`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDFs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const toggleDocSelection = (docKey: string) => {
    setSelectedDocs(prev => 
      prev.includes(docKey) 
        ? prev.filter(k => k !== docKey)
        : [...prev, docKey]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocs.length === availableDocs.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(availableDocs.map(d => d.key));
    }
  };

  const allSelected = selectedDocs.length === availableDocs.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-56 pb-8">
        <div className="mb-6 flex gap-2">
          {doc ? (
            <Link to="/documentation">
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
            <div className="flex items-center justify-between">
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
              {doc && content && !loading && !error && (
                <Button 
                  onClick={exportToPDF} 
                  disabled={exporting}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? "Exporting..." : "Export PDF"}
                </Button>
              )}
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
                  ref={contentRef}
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
                />
              </ScrollArea>
            )}

            {!loading && !doc && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Available Documentation</h2>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="gap-2"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      {allSelected ? "Deselect All" : "Select All"}
                    </Button>
                    {selectedDocs.length > 0 && (
                      <Button
                        onClick={exportMultipleToPDF}
                        disabled={exporting}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export {selectedDocs.length} Document{selectedDocs.length > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  {availableDocs.map((docItem) => (
                    <div
                      key={docItem.key}
                      className="flex items-start gap-4 p-4 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors"
                    >
                      <Checkbox
                        checked={selectedDocs.includes(docItem.key)}
                        onCheckedChange={() => toggleDocSelection(docItem.key)}
                        className="mt-1"
                      />
                      <Link
                        to={`/documentation?doc=${docItem.key}`}
                        className="flex-1"
                      >
                        <h3 className="font-semibold mb-1 hover:text-primary">{docItem.title}</h3>
                        <p className="text-sm text-muted-foreground">{docItem.description}</p>
                      </Link>
                    </div>
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
