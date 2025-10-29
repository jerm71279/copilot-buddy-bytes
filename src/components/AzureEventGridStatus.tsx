import { useState, useEffect } from "react";
import { CIService } from "@/services/ciService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle2, Activity, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const AzureEventGridStatus = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [recentChanges, setRecentChanges] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    setWebhookUrl(`${baseUrl}/functions/v1/azure-event-grid-webhook`);
    loadRecentAutoChanges();
  }, []);

  const loadRecentAutoChanges = async () => {
    try {
      const count = await CIService.countRecentAutomatedChanges(24);
      setRecentChanges(count);
    } catch (error) {
      console.error('Error loading recent changes:', error);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Azure Event Grid Integration
            </CardTitle>
            <CardDescription>
              Automatically log Azure infrastructure changes in real-time
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/60">
            <span className="text-primary">{recentChanges} changes logged (24h)</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Webhook URL */}
        <div>
          <label className="text-sm font-medium mb-2 block">Webhook Endpoint URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono"
            />
            <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Setup Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup in Azure Portal:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Go to Azure Monitor → Activity Log → Export Activity Logs</li>
              <li>Create Event Grid System Topic for Activity Log</li>
              <li>Add Event Subscription with above webhook URL</li>
              <li>Filter for: Administrative operations (Write, Delete, Action)</li>
              <li>Set status filter to "Succeeded"</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* What Gets Tracked */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Automatically Tracked Changes:</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Virtual Machines',
              'Virtual Networks',
              'Network Security Groups',
              'Storage Accounts',
              'App Registrations',
              'Service Principals',
              'Load Balancers',
              'Public IP Addresses',
            ].map((item) => (
              <Badge key={item} variant="secondary" className="justify-center">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Documentation Link */}
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => window.open('https://learn.microsoft.com/en-us/azure/event-grid/event-schema-activity-log', '_blank')}
        >
          View Azure Event Grid Documentation →
        </Button>
      </CardContent>
    </Card>
  );
};