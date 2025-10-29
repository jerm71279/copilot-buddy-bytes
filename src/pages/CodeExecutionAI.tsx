import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Code, Play, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStandardToast } from "@/hooks/useStandardToast";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const CodeExecutionAI = () => {
  const [code, setCode] = useState("console.log('Hello from AI!');");
  const [output, setOutput] = useState<any>(null);
  const toast = useStandardToast();

  const executeCode = useMutation({
    mutationFn: async (codeToRun: string) => {
      const { data, error } = await supabase.functions.invoke('code-execution', {
        body: { code: codeToRun, language: 'javascript' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setOutput(data);
      toast.success("Code ran successfully in sandbox");
    },
    onError: (error: any) => {
      setOutput({ success: false, error: error.message });
      toast.error(error.message);
    }
  });

  return (
    <DashboardLayout>
        
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Code className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Code Execution AI</h1>
              <p className="text-muted-foreground text-lg">Run code safely in AI conversations</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
              <CardDescription>Write and execute JavaScript code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="// Enter JavaScript code here..."
              />
              <Button 
                className="w-full" 
                onClick={() => executeCode.mutate(code)}
                disabled={!code || executeCode.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Code
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution Output</CardTitle>
              <CardDescription>Results and console output</CardDescription>
            </CardHeader>
            <CardContent>
              {!output ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Run code to see output</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {output.success ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <Badge variant="default">Success</Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-destructive" />
                        <Badge variant="destructive">Error</Badge>
                      </>
                    )}
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Console Output:</p>
                    <pre className="text-sm font-mono overflow-x-auto">
                      {output.success 
                        ? JSON.stringify(output.result, null, 2)
                        : output.error
                      }
                    </pre>
                  </div>

                  {output.logs && output.logs.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Logs:</p>
                      <div className="space-y-1">
                        {output.logs.map((log: string, idx: number) => (
                          <p key={idx} className="text-sm font-mono">{log}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {output.execution_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Execution Time:</span>
                      <Badge variant="outline">{output.execution_time}ms</Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Safety Features</CardTitle>
            <CardDescription>Sandboxed execution environment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Time Limit", value: "5 seconds", description: "Prevents infinite loops" },
                { title: "Memory Limit", value: "128 MB", description: "Controls resource usage" },
                { title: "Sandboxed", value: "Isolated", description: "No file system access" }
              ].map((feature) => (
                <div key={feature.title} className="p-4 border rounded-lg">
                  <p className="font-medium mb-1">{feature.title}</p>
                  <p className="text-2xl font-bold text-primary mb-1">{feature.value}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

    </DashboardLayout>
  );
};

export default CodeExecutionAI;
