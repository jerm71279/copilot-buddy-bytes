import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PromptLibrary } from "@/components/PromptLibrary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, BookOpen, Zap } from "lucide-react";

interface PromptTemplate {
  id: string;
  template_name: string;
  prompt_template: string;
  description: string;
}

export default function PromptLibraryPage() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    toast.success(`Selected: ${template.template_name}`);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Smart Prompt Library
          </h1>
          <p className="text-muted-foreground mt-2">
            Pre-built, optimized prompts to maximize AI effectiveness across your organization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Best Practices
            </CardTitle>
            <CardDescription>Built-in expertise</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Each template is crafted using AI prompt engineering best practices, 
              ensuring you get high-quality, consistent results every time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Auto-Context
            </CardTitle>
            <CardDescription>Smart data injection</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Templates automatically inject relevant business context like metrics, 
              incidents, and changes - no manual copy-pasting required.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Role-Specific
            </CardTitle>
            <CardDescription>Tailored to you</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              See only prompts relevant to your role and department, 
              ensuring you always have the right tools for your work.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>💡 Prompt Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">✅ DO:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Be specific about what you need</li>
                <li>• Provide relevant context</li>
                <li>• Specify the desired format</li>
                <li>• Use templates as starting points</li>
                <li>• Iterate and refine your prompts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">❌ DON'T:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Be too vague or general</li>
                <li>• Ask multiple unrelated questions</li>
                <li>• Assume the AI knows your context</li>
                <li>• Expect perfect first results</li>
                <li>• Forget to review AI outputs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <PromptLibrary onSelectTemplate={handleSelectTemplate} />

      {selectedTemplate && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Selected Template</CardTitle>
            <CardDescription>{selectedTemplate.template_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">{selectedTemplate.description}</p>
            <div className="bg-muted p-4 rounded-md">
              <p className="font-mono text-sm">{selectedTemplate.prompt_template}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Copy this template and fill in the placeholders (shown in {'{curly braces}'}) 
              with your specific information.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}