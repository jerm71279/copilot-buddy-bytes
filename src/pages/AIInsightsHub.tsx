import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, TrendingUp, AlertCircle, Loader2, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/shared/PageContainer";
import { useStandardToast } from "@/hooks/useStandardToast";

const AIInsightsHub = () => {
  const [query, setQuery] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const toast = useStandardToast();

  const domains = [
    { id: 'hr', label: 'HR' },
    { id: 'it', label: 'IT' },
    { id: 'finance', label: 'Finance' },
    { id: 'sales', label: 'Sales' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'operations', label: 'Operations' }
  ];

  // Fetch recent insights
  const { data: recentInsights, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    }
  });

  // Generate new insight
  const generateInsight = useMutation({
    mutationFn: async ({ query, domains }: { query: string; domains: string[] }) => {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          query,
          context: 'AI Insights Hub',
          domains
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      setQuery("");
      toast.success("Insight generated successfully");
    },
    onError: (error: any) => {
      console.error("Insight generation error:", error);
      if (error.message?.includes("Rate limit")) {
        toast.error("Rate limit exceeded", { description: "Please try again in a moment." });
      } else if (error.message?.includes("credits")) {
        toast.error("AI credits exhausted", { description: "Please contact your administrator." });
      } else {
        toast.error("Failed to generate insight");
      }
    }
  });

  const toggleDomain = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(d => d !== domainId)
        : [...prev, domainId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }
    generateInsight.mutate({ query: query.trim(), domains: selectedDomains });
  };

  return (
    <PageContainer>
      {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Insights Hub</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Ask questions, get intelligent analysis, and discover insights across your data
          </p>
        </div>

        {/* Query Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask AI Anything
            </CardTitle>
            <CardDescription>
              Natural language queries about your data, trends, or operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Domain Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Focus Domains (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {domains.map(domain => (
                    <Badge
                      key={domain.id}
                      variant={selectedDomains.includes(domain.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDomain(domain.id)}
                    >
                      {domain.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Query Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., What are the top HR trends this month? Any compliance risks?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={generateInsight.isPending}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={generateInsight.isPending || !query.trim()}
                  className="gap-2"
                >
                  {generateInsight.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Ask AI
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Example Queries */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Example queries:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Show me HR onboarding completion rates",
                  "Any security incidents this week?",
                  "Top performing sales teams",
                  "Compliance audit readiness status"
                ].map((example) => (
                  <Button
                    key={example}
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuery(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Recent Insights</h2>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Loading insights...</p>
              </CardContent>
            </Card>
          ) : recentInsights && recentInsights.length > 0 ? (
            <div className="grid gap-4">
              {recentInsights.map((insight: any) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{insight.query}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{new Date(insight.created_at).toLocaleString()}</span>
                          {insight.domains && insight.domains.length > 0 && (
                            <div className="flex gap-1">
                              {insight.domains.map((domain: string) => (
                                <Badge key={domain} variant="outline" className="text-xs">
                                  {domain}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{insight.insight}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
                 <p className="text-muted-foreground max-w-md mx-auto">
                   Ask your first question above to get AI-powered insights about your data and operations
                 </p>
               </CardContent>
             </Card>
           )}
         </div>
    </PageContainer>
  );
};

export default AIInsightsHub;
