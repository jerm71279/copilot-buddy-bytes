import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Sparkles, Info } from "lucide-react";

interface PromptTemplate {
  id: string;
  template_name: string;
  category: string;
  prompt_template: string;
  description: string;
  context_hints: any;
}

interface PromptTemplateSelectorProps {
  onSelectTemplate: (template: PromptTemplate) => void;
  department?: string;
}

export const PromptTemplateSelector = ({ 
  onSelectTemplate, 
  department 
}: PromptTemplateSelectorProps) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [department]);

  const fetchTemplates = async () => {
    try {
      let query = supabase
        .from("prompt_templates")
        .select("*")
        .eq("is_active", true)
        .order("usage_count", { ascending: false });

      if (department) {
        query = query.or(`department.eq.${department},department.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      onSelectTemplate(template);
      toast.success(`Using: ${template.template_name}`);
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, PromptTemplate[]>);

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handleSelect} disabled={isLoading}>
        <SelectTrigger className="w-[300px]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <SelectValue placeholder="Choose a prompt template..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground capitalize">
                {category}
              </div>
              {categoryTemplates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <span>{template.template_name}</span>
                    {template.context_hints?.inject && (
                      <Badge variant="secondary" className="text-xs">
                        Auto-context
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {selectedTemplate && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-semibold">{selectedTemplate.template_name}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>
              {selectedTemplate.context_hints?.inject && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium mb-1">Auto-injected context:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.context_hints.inject.map((hint: string) => (
                      <Badge key={hint} variant="outline" className="text-xs">
                        {hint}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};