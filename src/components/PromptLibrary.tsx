import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Sparkles, TrendingUp, Copy, ThumbsUp } from "lucide-react";

interface PromptTemplate {
  id: string;
  template_name: string;
  category: string;
  prompt_template: string;
  description: string;
  example_usage: string;
  tags: string[];
  usage_count: number;
}

interface PromptLibraryProps {
  onSelectTemplate: (template: PromptTemplate) => void;
}

export const PromptLibrary = ({ onSelectTemplate }: PromptLibraryProps) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("is_active", true)
        .order("usage_count", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load prompt templates");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ["all", ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const copyTemplate = async (template: PromptTemplate) => {
    await navigator.clipboard.writeText(template.prompt_template);
    toast.success("Template copied to clipboard!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Smart Prompt Library</CardTitle>
        </div>
        <CardDescription>
          Pre-built prompts optimized for different tasks and departments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="grid gap-3">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{template.template_name}</h4>
                              {template.usage_count > 10 && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>

                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-sm font-mono">{template.prompt_template}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {template.category}
                          </Badge>
                          {template.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => onSelectTemplate(template)}
                            className="flex-1"
                          >
                            Use Template
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground italic">
                          💡 {template.example_usage}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No templates found matching your search.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};