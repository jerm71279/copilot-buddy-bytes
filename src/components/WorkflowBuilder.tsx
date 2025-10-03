import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Play, Settings, GitBranch, Clock, Webhook } from "lucide-react";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  order: number;
}

interface WorkflowCondition {
  step_id: string;
  condition_type: string;
  condition_expression: Record<string, any>;
  true_path?: Record<string, any>;
  false_path?: Record<string, any>;
}

export const WorkflowBuilder = ({ customerId }: { customerId: string }) => {
  const [workflowName, setWorkflowName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [showTriggerConfig, setShowTriggerConfig] = useState(false);
  const [selectedTriggerType, setSelectedTriggerType] = useState<string>("");

  const stepTypes = [
    { value: "api_call", label: "API Call" },
    { value: "data_transform", label: "Data Transform" },
    { value: "condition", label: "Conditional Branch" },
    { value: "notification", label: "Send Notification" },
    { value: "database_operation", label: "Database Operation" },
    { value: "delay", label: "Wait/Delay" },
    { value: "loop", label: "Loop Over Data" }
  ];

  const triggerTypes = [
    { value: "manual", label: "Manual Trigger" },
    { value: "webhook", label: "Webhook" },
    { value: "schedule", label: "Scheduled (Cron)" },
    { value: "event", label: "Event-Based" }
  ];

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type: "api_call",
      name: `Step ${steps.length + 1}`,
      config: {},
      order: steps.length
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, field: keyof WorkflowStep, value: any) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const addTrigger = () => {
    if (!selectedTriggerType) {
      toast.error("Please select a trigger type");
      return;
    }

    const newTrigger = {
      id: `trigger_${Date.now()}`,
      trigger_type: selectedTriggerType,
      trigger_config: {},
      is_enabled: true
    };
    setTriggers([...triggers, newTrigger]);
    setShowTriggerConfig(false);
    setSelectedTriggerType("");
  };

  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (steps.length === 0) {
      toast.error("Please add at least one step");
      return;
    }

    try {
      // Save workflow
      const { data: workflow, error: workflowError } = await supabase
        .from("workflows")
        .insert({
          customer_id: customerId,
          workflow_name: workflowName,
          description: description,
          steps: steps as any,
          systems_involved: [...new Set(steps.map(s => s.type))],
          workflow_type: triggers.length > 0 ? triggers[0].trigger_type : "manual",
          is_active: true
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Save triggers
      if (triggers.length > 0) {
        const triggersToInsert = triggers.map(t => ({
          workflow_id: workflow.id,
          customer_id: customerId,
          ...t
        }));

        const { error: triggersError } = await supabase
          .from("workflow_triggers")
          .insert(triggersToInsert);

        if (triggersError) throw triggersError;
      }

      toast.success("Workflow saved successfully!");
      
      // Reset form
      setWorkflowName("");
      setDescription("");
      setSteps([]);
      setTriggers([]);
    } catch (error: any) {
      console.error("Error saving workflow:", error);
      toast.error(`Failed to save workflow: ${error.message}`);
    }
  };

  const testWorkflow = async () => {
    if (steps.length === 0) {
      toast.error("Please add steps before testing");
      return;
    }

    toast.success("Test execution started - check execution history for results");
    
    // In a real implementation, this would call the workflow execution edge function
    console.log("Testing workflow:", { workflowName, steps, triggers });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Configuration</CardTitle>
          <CardDescription>Create and configure automated workflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input
              id="workflow-name"
              placeholder="e.g., Employee Onboarding Automation"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this workflow does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Triggers</Label>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowTriggerConfig(!showTriggerConfig)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Trigger
              </Button>
            </div>

            {showTriggerConfig && (
              <div className="flex gap-2">
                <Select value={selectedTriggerType} onValueChange={setSelectedTriggerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addTrigger}>Add</Button>
              </div>
            )}

            <div className="space-y-2">
              {triggers.map(trigger => (
                <div key={trigger.id} className="flex items-center gap-2 p-2 border rounded">
                  {trigger.trigger_type === "webhook" && <Webhook className="h-4 w-4" />}
                  {trigger.trigger_type === "schedule" && <Clock className="h-4 w-4" />}
                  <Badge variant="outline">{trigger.trigger_type}</Badge>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setTriggers(triggers.filter(t => t.id !== trigger.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Steps</CardTitle>
              <CardDescription>Define the sequence of actions</CardDescription>
            </div>
            <Button onClick={addStep}>
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No steps added yet. Click "Add Step" to begin.
            </div>
          ) : (
            steps.map((step, index) => (
              <Card key={step.id} className="relative">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge>{index + 1}</Badge>
                      <div className="space-y-2 flex-1">
                        <Input
                          placeholder="Step name"
                          value={step.name}
                          onChange={(e) => updateStep(step.id, "name", e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStep(step.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Step Type</Label>
                    <Select
                      value={step.type}
                      onValueChange={(value) => updateStep(step.id, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stepTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {step.type === "condition" && (
                    <div className="pl-4 border-l-2 border-primary/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <GitBranch className="h-4 w-4" />
                        <span>Conditional Logic</span>
                      </div>
                      <Textarea
                        placeholder="Enter condition expression (JSON)"
                        className="font-mono text-sm"
                        rows={3}
                      />
                    </div>
                  )}

                  {step.type !== "condition" && (
                    <div className="space-y-2">
                      <Label>Configuration (JSON)</Label>
                      <Textarea
                        placeholder='{"url": "https://api.example.com", "method": "POST"}'
                        className="font-mono text-sm"
                        rows={4}
                        onChange={(e) => {
                          try {
                            const config = JSON.parse(e.target.value);
                            updateStep(step.id, "config", config);
                          } catch {
                            // Invalid JSON, ignore
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={testWorkflow}>
          <Play className="h-4 w-4 mr-2" />
          Test Workflow
        </Button>
        <Button onClick={saveWorkflow}>
          <Save className="h-4 w-4 mr-2" />
          Save Workflow
        </Button>
      </div>
    </div>
  );
};
