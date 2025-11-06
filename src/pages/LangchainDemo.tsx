import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Sparkles } from "lucide-react";
import { useLangchain } from "@/hooks/useLangchain";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const LangchainDemo = () => {
  const [query, setQuery] = useState("");
  const [template, setTemplate] = useState("You are a helpful AI assistant. Answer the following question:\n\n{query}");
  const [response, setResponse] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  
  const { langchainChat } = useLangchain();

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    setResponse("");
    const result = await langchainChat.invoke({ query, template, model });
    
    if (result) {
      setResponse(result.response);
    }
  };

  const suggestedQueries = [
    "Explain quantum computing in simple terms",
    "What are the benefits of microservices architecture?",
    "How does machine learning work?",
    "Explain the SOLID principles in software development"
  ];

  return (
    <DashboardLayout className="max-w-7xl" noPadding>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Link2 className="h-8 w-8 text-primary" />
              Langchain Integration
            </h1>
            <p className="text-muted-foreground mt-1">
              Powered by Langchain + Lovable AI Gateway
            </p>
          </div>

          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Langchain Enabled
          </Badge>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">AI Model</Label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background mt-1"
                disabled={langchainChat.isLoading}
              >
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="openai/gpt-5-mini">GPT-5 Mini</option>
                <option value="openai/gpt-5">GPT-5</option>
              </select>
            </div>

            <div>
              <Label htmlFor="template">Prompt Template</Label>
              <Textarea
                id="template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Enter your prompt template. Use {query} for the user's question."
                className="min-h-[80px] mt-1"
                disabled={langchainChat.isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {"{query}"} as a placeholder for the user's question
              </p>
            </div>

            <div>
              <Label htmlFor="query">Your Question</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                disabled={langchainChat.isLoading}
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Suggestions:</span>
              {suggestedQueries.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(suggestion)}
                  disabled={langchainChat.isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={langchainChat.isLoading || !query.trim()}
              className="w-full"
            >
              {langchainChat.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Run Langchain
                </>
              )}
            </Button>
          </div>
        </Card>

        {response && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Response
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {response}
              </pre>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-2">💡 How It Works</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Langchain Integration</strong> - Uses Langchain's chain abstraction for structured AI workflows</li>
            <li>• <strong>Lovable AI Gateway</strong> - Powered by your existing Gemini/GPT-5 models (no extra API keys needed)</li>
            <li>• <strong>Prompt Templates</strong> - Customize how the AI receives and processes queries</li>
            <li>• <strong>Extensible</strong> - Add memory, agents, tools, and more Langchain features</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LangchainDemo;
