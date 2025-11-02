import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MCPRAGQueryProps {
  serverId?: string;
  serverName?: string;
}

interface RetrievedDoc {
  id: string;
  title: string;
  content: string;
  content_type: string;
  similarity: number;
}

export function MCPRAGQuery({ serverId, serverName }: MCPRAGQueryProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [retrievedDocs, setRetrievedDocs] = useState<RetrievedDoc[]>([]);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const handleQuery = async () => {
    if (!query.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setRetrievedDocs([]);

    try {
      const { data, error } = await supabase.functions.invoke('mcp-rag-query', {
        body: {
          query: query.trim(),
          serverId,
          topK: 5,
        },
      });

      if (error) throw error;

      if (data.success) {
        setResponse(data.response);
        setRetrievedDocs(data.retrievedDocs || []);
        setResponseTime(data.responseTime);
        toast.success("Query completed");
      } else {
        throw new Error(data.error || "Query failed");
      }
    } catch (error) {
      console.error("RAG query error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process query");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Knowledge Assistant</CardTitle>
              <CardDescription>
                Ask questions about {serverName || "your knowledge base"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ask a question about the documentation, tools, or procedures..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
            <Button
              onClick={handleQuery}
              disabled={isLoading || !query.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ask Question
                </>
              )}
            </Button>
          </div>

          {response && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">AI Response</h4>
                {responseTime && (
                  <Badge variant="outline" className="text-xs">
                    {responseTime}ms
                  </Badge>
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          )}

          {retrievedDocs.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <h4 className="font-semibold">Referenced Documents</h4>
                <Badge variant="secondary">{retrievedDocs.length}</Badge>
              </div>
              <div className="space-y-2">
                {retrievedDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="bg-muted/30 rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{doc.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {(doc.similarity * 100).toFixed(0)}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {doc.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
