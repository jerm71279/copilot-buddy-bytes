import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStandardToast } from "@/hooks/useStandardToast";

const ExtendedThinkingAI = () => {
  const [prompt, setPrompt] = useState("");
  const [thinkingProcess, setThinkingProcess] = useState<any[]>([]);
  const toast = useStandardToast();

  const deepThinking = useMutation({
    mutationFn: async (userPrompt: string) => {
      const { data, error } = await supabase.functions.invoke('extended-thinking', {
        body: { prompt: userPrompt, mode: 'deep' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setThinkingProcess(data.reasoning_steps || []);
      toast.success("Extended thinking process finished");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Extended Thinking AI</h1>
              <p className="text-muted-foreground text-lg">Deep reasoning for complex problems</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Problem Input</CardTitle>
              <CardDescription>Describe a complex problem for deep analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., Analyze the trade-offs between microservices and monolithic architecture for a data-intensive application..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px]"
              />
              <Button 
                className="w-full" 
                onClick={() => deepThinking.mutate(prompt)}
                disabled={!prompt || deepThinking.isPending}
              >
                {deepThinking.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Thinking Deeply...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze with Extended Thinking
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reasoning Process</CardTitle>
              <CardDescription>Step-by-step thought analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {thinkingProcess.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Submit a problem to see the reasoning process</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {thinkingProcess.map((step, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-start gap-3 mb-2">
                        {step.type === 'conclusion' ? (
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        ) : step.type === 'consideration' ? (
                          <AlertCircle className="h-5 w-5 text-secondary mt-0.5" />
                        ) : (
                          <Brain className="h-5 w-5 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              Step {idx + 1}
                            </Badge>
                            <Badge variant={
                              step.type === 'conclusion' ? 'default' :
                              step.type === 'consideration' ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {step.type}
                            </Badge>
                          </div>
                          <p className="text-sm">{step.content}</p>
                          {step.confidence && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Confidence:</span>
                              <div className="flex-1 bg-muted rounded-full h-1">
                                <div 
                                  className="bg-primary rounded-full h-1" 
                                  style={{ width: `${step.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{step.confidence}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ExtendedThinkingAI;
