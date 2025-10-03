import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Webhook, Clock, RefreshCw } from "lucide-react";

interface Workflow {
  id: string;
  workflow_name: string;
}

interface Trigger {
  id: string;
  workflow_id: string;
  trigger_type: string;
  trigger_config: any;
  webhook_url: string | null;
  is_enabled: boolean;
  last_triggered_at: string | null;
  workflows: {
    workflow_name: string;
  };
}

export const WorkflowTriggerManager = ({ customerId }: { customerId: string }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    try {
      const [workflowsData, triggersData] = await Promise.all([
        supabase
          .from("workflows")
          .select("id, workflow_name")
          .eq("customer_id", customerId)
          .eq("is_active", true),
        supabase
          .from("workflow_triggers")
          .select(`
            *,
            workflows(workflow_name)
          `)
          .eq("customer_id", customerId)
      ]);

      if (workflowsData.error) throw workflowsData.error;
      if (triggersData.error) throw triggersData.error;

      setWorkflows(workflowsData.data || []);
      setTriggers((triggersData.data || []) as any);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load workflows and triggers");
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhookTrigger = async (workflowId: string) => {
    try {
      const { data, error } = await supabase
        .from("workflow_triggers")
        .insert({
          workflow_id: workflowId,
          customer_id: customerId,
          trigger_type: "webhook",
          trigger_config: {},
          is_enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      // Generate webhook URL
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workflow-webhook?id=${data.id}`;
      
      await supabase
        .from("workflow_triggers")
        .update({ webhook_url: webhookUrl })
        .eq("id", data.id);

      toast.success("Webhook trigger created!");
      fetchData();
    } catch (error: any) {
      console.error("Error creating webhook:", error);
      toast.error(`Failed to create webhook: ${error.message}`);
    }
  };

  const toggleTrigger = async (triggerId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("workflow_triggers")
        .update({ is_enabled: !currentState })
        .eq("id", triggerId);

      if (error) throw error;

      toast.success(`Trigger ${!currentState ? "enabled" : "disabled"}`);
      fetchData();
    } catch (error: any) {
      console.error("Error toggling trigger:", error);
      toast.error("Failed to update trigger");
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied to clipboard!");
  };

  const testWebhook = async (webhookUrl: string) => {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast.success("Test webhook triggered successfully!");
    } catch (error: any) {
      console.error("Error testing webhook:", error);
      toast.error(`Failed to test webhook: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Triggers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Triggers</CardTitle>
          <CardDescription>Manage webhook and scheduled triggers for your workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {triggers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No triggers configured yet. Create a workflow with triggers to see them here.
            </div>
          ) : (
            <div className="space-y-4">
              {triggers.map((trigger) => (
                <Card key={trigger.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {trigger.trigger_type === "webhook" ? (
                              <Webhook className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                            <h4 className="font-semibold">
                              {trigger.workflows?.workflow_name || "Unknown Workflow"}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{trigger.trigger_type}</Badge>
                            {trigger.last_triggered_at && (
                              <span className="text-xs text-muted-foreground">
                                Last: {new Date(trigger.last_triggered_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`trigger-${trigger.id}`} className="text-sm">
                            Enabled
                          </Label>
                          <Switch
                            id={`trigger-${trigger.id}`}
                            checked={trigger.is_enabled}
                            onCheckedChange={() => toggleTrigger(trigger.id, trigger.is_enabled)}
                          />
                        </div>
                      </div>

                      {trigger.trigger_type === "webhook" && trigger.webhook_url && (
                        <div className="space-y-2">
                          <Label>Webhook URL</Label>
                          <div className="flex gap-2">
                            <Input
                              value={trigger.webhook_url}
                              readOnly
                              className="font-mono text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyWebhookUrl(trigger.webhook_url!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testWebhook(trigger.webhook_url!)}
                            >
                              Test
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Send POST requests to this URL to trigger the workflow
                          </p>
                        </div>
                      )}

                      {trigger.trigger_type === "schedule" && (
                        <div className="space-y-2">
                          <Label>Schedule Configuration</Label>
                          <div className="p-3 bg-muted rounded font-mono text-sm">
                            {JSON.stringify(trigger.trigger_config, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Create new triggers for your workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Create a workflow first to add triggers
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <span className="font-medium">{workflow.workflow_name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createWebhookTrigger(workflow.id)}
                  >
                    <Webhook className="h-4 w-4 mr-2" />
                    Add Webhook
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
