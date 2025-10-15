import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  template_name: string;
  category: string;
  description: string;
  default_priority: string;
  default_risk_level: string;
  estimated_duration_minutes: number;
}

interface Scenario {
  id: string;
  scenario_name: string;
  scenario_description: string;
  impact_level: string;
  typical_duration_minutes: number;
  requires_emergency_approval: boolean;
  compliance_tags: string[];
  recommended_testing: string;
  recommended_rollback: string;
}

interface ChangeRequestTemplateSelector {
  customerId: string | null;
  onTemplateSelect: (template: Template | null, scenario: Scenario | null) => void;
}

export const ChangeRequestTemplateSelector = ({
  customerId,
  onTemplateSelect,
}: ChangeRequestTemplateSelector) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (customerId) {
      fetchTemplates();
    }
  }, [customerId]);

  useEffect(() => {
    if (selectedTemplate) {
      fetchScenarios(selectedTemplate.id);
    } else {
      setScenarios([]);
      setSelectedScenario(null);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    onTemplateSelect(selectedTemplate, selectedScenario);
  }, [selectedTemplate, selectedScenario, onTemplateSelect]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('change_request_templates')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error loading templates",
        description: "Failed to load change request templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScenarios = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('change_request_template_scenarios')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setScenarios(data || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast({
        title: "Error loading scenarios",
        description: "Failed to load template scenarios",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'azure_infrastructure': return 'bg-blue-500';
      case 'manual_support': return 'bg-green-500';
      case 'external_tools': return 'bg-purple-500';
      case 'retroactive': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Templates Available</CardTitle>
          <CardDescription>
            Contact your administrator to set up change request templates
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Change Category</CardTitle>
          <CardDescription>
            Choose a template category for your change request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary border-2'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {template.template_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {template.estimated_duration_minutes}m
                        </div>
                      </div>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTemplate && scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Scenario (Optional)</CardTitle>
            <CardDescription>
              Choose a specific scenario to pre-fill additional details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <Card
                    key={scenario.id}
                    className={`cursor-pointer transition-all ${
                      selectedScenario?.id === scenario.id
                        ? 'border-primary border-2'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() =>
                      setSelectedScenario(
                        selectedScenario?.id === scenario.id ? null : scenario
                      )
                    }
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">
                              {scenario.scenario_name}
                            </CardTitle>
                            {selectedScenario?.id === scenario.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge
                              variant="outline"
                              className={getImpactColor(scenario.impact_level)}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {scenario.impact_level} impact
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {scenario.typical_duration_minutes}m
                            </div>
                            {scenario.requires_emergency_approval && (
                              <Badge variant="destructive">Emergency Approval</Badge>
                            )}
                          </div>
                          <CardDescription className="mt-2">
                            {scenario.scenario_description}
                          </CardDescription>
                        </div>
                      </div>

                      {selectedScenario?.id === scenario.id && (
                        <>
                          <Separator className="my-3" />
                          <div className="space-y-3 text-sm">
                            {scenario.compliance_tags.length > 0 && (
                              <div>
                                <Label className="text-xs font-semibold">
                                  Compliance Tags
                                </Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {scenario.compliance_tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {scenario.recommended_testing && (
                              <div>
                                <Label className="text-xs font-semibold flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Recommended Testing
                                </Label>
                                <p className="text-muted-foreground mt-1">
                                  {scenario.recommended_testing}
                                </p>
                              </div>
                            )}

                            {scenario.recommended_rollback && (
                              <div>
                                <Label className="text-xs font-semibold flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Recommended Rollback
                                </Label>
                                <p className="text-muted-foreground mt-1">
                                  {scenario.recommended_rollback}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {selectedTemplate && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTemplate(null);
              setSelectedScenario(null);
            }}
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
};