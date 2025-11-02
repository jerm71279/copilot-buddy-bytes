import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BookOpen, Settings2, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MCPRAGQueryProps {
  serverId?: string;
  serverName?: string;
  initialQuery?: string;
}

interface RetrievedDoc {
  id: string;
  title: string;
  content: string;
  content_type: string;
  similarity: number;
}

export function MCPRAGQuery({ serverId, serverName, initialQuery = "" }: MCPRAGQueryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [retrievedDocs, setRetrievedDocs] = useState<RetrievedDoc[]>([]);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [topK, setTopK] = useState([5]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastQueryId, setLastQueryId] = useState<string | null>(null);

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
          topK: topK[0],
        },
      });

      if (error) throw error;

      if (data.success) {
        setResponse(data.response);
        setRetrievedDocs(data.retrievedDocs || []);
        setResponseTime(data.responseTime);
        setLastQueryId(data.queryId);
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

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      toast.success("Response copied to clipboard");
    }
  };

  const handleFeedback = async (isPositive: boolean) => {
    if (!lastQueryId) return;
    
    try {
      const { error } = await supabase
        .from("mcp_rag_queries")
        .update({ 
          feedback: isPositive ? "positive" : "negative" 
        })
        .eq("id", lastQueryId);

      if (error) throw error;
      toast.success(`Feedback recorded`);
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to record feedback");
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && query.trim()) {
                  handleQuery();
                }
              }}
            />
            
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  <Settings2 className="h-4 w-4 mr-2" />
                  {showAdvanced ? "Hide" : "Show"} Advanced Options
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Results to retrieve (Top-K)</Label>
                    <Badge variant="outline">{topK[0]}</Badge>
                  </div>
                  <Slider
                    value={topK}
                    onValueChange={setTopK}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    More results provide broader context but may include less relevant information
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

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
                <div className="flex items-center gap-2">
                  {responseTime && (
                    <Badge variant="outline" className="text-xs">
                      {responseTime}ms
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResponse}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{response}</p>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs text-muted-foreground">Was this helpful?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback(true)}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback(false)}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
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
