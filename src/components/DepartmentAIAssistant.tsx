import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { PromptTemplateSelector } from "./PromptTemplateSelector";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Message = {
  role: "user" | "assistant";
  content: string;
  templateUsed?: string;
  contextInjected?: string[];
};

interface PromptTemplate {
  id: string;
  template_name: string;
  prompt_template: string;
  context_hints: any;
}

interface DepartmentAIAssistantProps {
  department: string;
  departmentLabel: string;
}

export const DepartmentAIAssistant = ({ department, departmentLabel }: DepartmentAIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    // Fill in the template with placeholders visible to user
    const templateText = template.prompt_template.replace(
      /\{(\w+)\}/g, 
      (_, key) => `[${key}]`
    );
    setInput(templateText);
    setShowTemplates(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { 
      role: "user", 
      content: userMessage,
      templateUsed: selectedTemplate?.template_name 
    }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("department-assistant", {
        body: {
          department,
          query: userMessage,
          conversationHistory: messages,
          templateId: selectedTemplate?.id,
          useContextInjection: true
        }
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
        } else if (error.message?.includes("402")) {
          toast.error("AI credits needed. Please contact your administrator.");
        } else {
          toast.error("Failed to get AI response");
        }
        console.error("AI Assistant error:", error);
        return;
      }

      if (data?.response) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.response,
          contextInjected: data.contextInjected 
        }]);
        
        if (data.toolCalled) {
          toast.success(`Used ${data.toolCalled} tool for analysis`);
        }
        
        if (data.contextInjected && data.contextInjected.length > 0) {
          toast.success(`Auto-injected ${data.contextInjected.length} context items`, {
            description: data.contextInjected.join(", ")
          });
        }
      }
      
      // Reset template selection after use
      setSelectedTemplate(null);
    } catch (err) {
      console.error("Error calling AI assistant:", err);
      toast.error("Failed to connect to AI assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>AI Assistant</CardTitle>
          </div>
          <Badge variant="outline">{departmentLabel}</Badge>
        </div>
        <CardDescription>
          Ask questions and get AI-powered insights specific to your department
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              {showTemplates ? "Hide" : "Show"} Smart Prompts
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <PromptTemplateSelector 
              onSelectTemplate={handleTemplateSelect}
              department={department}
            />
          </CollapsibleContent>
        </Collapsible>

        <ScrollArea className="h-[400px] w-full border rounded-md p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">
                Ask me anything about {departmentLabel.toLowerCase()}.<br />
                I have access to AI-powered analytics tools and smart prompts.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowTemplates(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Browse Smart Prompts
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.templateUsed && (
                    <Badge variant="secondary" className="mb-1 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {msg.templateUsed}
                    </Badge>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.contextInjected && msg.contextInjected.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {msg.contextInjected.map((ctx, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {ctx}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
