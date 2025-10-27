import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Copy, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useStandardToast } from "@/hooks/useStandardToast";

interface Pattern {
  id: string;
  pattern_name: string;
  pattern_slug: string;
  description: string;
  category: string;
  tags: string[];
  usage_count: number;
  input_placeholder: string;
}

export default function PatternLibrary() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const toast = useStandardToast();

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_patterns')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setPatterns(data || []);
    } catch (error) {
      console.error('Error fetching patterns:', error);
      toast.error("Failed to load patterns");
    } finally {
      setIsLoading(false);
    }
  };

  const executePattern = async () => {
    if (!selectedPattern || !inputText.trim()) {
      toast.error("Please select a pattern and enter text");
      return;
    }

    setIsExecuting(true);
    setOutput("");

    try {
      const { data, error } = await supabase.functions.invoke('pattern-executor', {
        body: {
          patternId: selectedPattern.id,
          inputText: inputText.trim(),
        },
      });

      if (error) throw error;

      setOutput(data.output);
      toast.success(`Pattern executed in ${data.executionTime}ms`);
    } catch (error: any) {
      console.error('Error executing pattern:', error);
      toast.error(error.message || "Failed to execute pattern");
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Content copied to clipboard");
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPattern?.pattern_slug || 'output'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [...new Set(patterns.map(p => p.category))];

  const PatternCard = ({ pattern }: { pattern: Pattern }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedPattern?.id === pattern.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => setSelectedPattern(pattern)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{pattern.pattern_name}</CardTitle>
          <Badge variant="secondary">{pattern.usage_count}</Badge>
        </div>
        <CardDescription className="text-sm">{pattern.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {pattern.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Pattern Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Fabric-style AI patterns for common tasks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pattern Library */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Patterns</CardTitle>
              <CardDescription>
                Select a pattern to execute
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="category">By Category</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-2">
                  <ScrollArea className="h-[600px] pr-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      patterns.map(pattern => (
                        <div key={pattern.id} className="mb-2">
                          <PatternCard pattern={pattern} />
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="category" className="space-y-4">
                  <ScrollArea className="h-[600px] pr-4">
                    {categories.map(category => (
                      <div key={category} className="mb-4">
                        <h3 className="font-semibold mb-2">{category}</h3>
                        <div className="space-y-2">
                          {patterns
                            .filter(p => p.category === category)
                            .map(pattern => (
                              <PatternCard key={pattern.id} pattern={pattern} />
                            ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Executor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedPattern ? selectedPattern.pattern_name : 'Pattern Executor'}
              </CardTitle>
              <CardDescription>
                {selectedPattern ? selectedPattern.description : 'Select a pattern to begin'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPattern ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Input</label>
                    <Textarea
                      placeholder={selectedPattern.input_placeholder}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    onClick={executePattern} 
                    disabled={isExecuting || !inputText.trim()}
                    className="w-full"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing Pattern...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Execute Pattern
                      </>
                    )}
                  </Button>

                  {output && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Output</label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(output)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={downloadOutput}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {output.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Select a pattern from the library to get started
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layer 1: Learning</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every pattern execution logs to your department, building local AI knowledge
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layer 2: Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Usage patterns aggregate across departments to identify best practices
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layer 3: Automation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            System auto-suggests new patterns based on your recurring tasks
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
