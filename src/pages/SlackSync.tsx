import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LogOut, MessageSquare, RefreshCw, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DashboardNavigation from "@/components/DashboardNavigation";

interface SlackConfig {
  id: string;
  workspace_id: string;
  workspace_name: string;
  channel_ids: string[];
  sync_enabled: boolean;
  last_sync_at: string | null;
  access_token_encrypted: string;
}

interface SlackSyncLog {
  id: string;
  status: string;
  messages_synced: number;
  messages_failed: number;
  sync_started_at: string;
  sync_completed_at: string | null;
  error_message: string | null;
}

const SlackSync = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<SlackConfig[]>([]);
  const [syncLogs, setSyncLogs] = useState<SlackSyncLog[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [channelIds, setChannelIds] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (customerId) {
      loadConfigs();
      loadSyncLogs();
    }
  }, [customerId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("customer_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile?.customer_id) {
      setCustomerId(profile.customer_id);
    }
  };

  const loadConfigs = async () => {
    const { data, error } = await supabase
      .from("slack_sync_config")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading configs:", error);
      toast.error("Failed to load Slack configurations");
      return;
    }

    setConfigs(data || []);
  };

  const loadSyncLogs = async () => {
    const { data, error } = await supabase
      .from("slack_sync_logs")
      .select("*")
      .order("sync_started_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading sync logs:", error);
      return;
    }

    setSyncLogs(data || []);
  };

  const handleAddConfig = async () => {
    if (!customerId || !workspaceId || !workspaceName || !channelIds || !accessToken) {
      toast.error("Please fill all required fields");
      return;
    }

    const channelIdsArray = channelIds.split(",").map(id => id.trim()).filter(id => id);

    const { error } = await supabase.from("slack_sync_config").insert({
      customer_id: customerId,
      workspace_id: workspaceId,
      workspace_name: workspaceName,
      channel_ids: channelIdsArray,
      access_token_encrypted: accessToken, // In production, encrypt this
      sync_enabled: true,
    });

    if (error) {
      console.error("Error adding config:", error);
      toast.error("Failed to add Slack configuration");
      return;
    }

    toast.success("Slack workspace connected");
    setIsAddDialogOpen(false);
    setWorkspaceId("");
    setWorkspaceName("");
    setChannelIds("");
    setAccessToken("");
    loadConfigs();
  };

  const handleToggleSync = async (configId: string, enabled: boolean) => {
    const { error } = await supabase
      .from("slack_sync_config")
      .update({ sync_enabled: enabled })
      .eq("id", configId);

    if (error) {
      console.error("Error toggling sync:", error);
      toast.error("Failed to update sync status");
      return;
    }

    toast.success(enabled ? "Sync enabled" : "Sync disabled");
    loadConfigs();
  };

  const handleSync = async (config: SlackConfig) => {
    setSyncing(true);
    try {
      // Trigger sync
      const { data, error } = await supabase.functions.invoke("slack-sync", {
        body: {
          syncConfigId: config.id,
          accessToken: config.access_token_encrypted,
        },
      });

      if (error) throw error;

      toast.success(`Synced ${data.messages_synced} messages from ${data.channels_processed} channels`);
      loadConfigs();
      loadSyncLogs();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync Slack messages");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    const { error } = await supabase
      .from("slack_sync_config")
      .delete()
      .eq("id", configId);

    if (error) {
      console.error("Error deleting config:", error);
      toast.error("Failed to delete configuration");
      return;
    }

    toast.success("Configuration deleted");
    loadConfigs();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Slack Sync</h1>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-56 pb-8">
        <DashboardNavigation 
          title="Slack Sync"
          dashboards={[
            { name: "Knowledge Base", path: "/knowledge" },
            { name: "SharePoint Sync", path: "/sharepoint-sync" },
            { name: "Intelligent Assistant", path: "/intelligent-assistant" },
          ]}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Connected Workspaces */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connected Workspaces</CardTitle>
                  <CardDescription>
                    Slack workspaces syncing to knowledge base
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect Slack Workspace</DialogTitle>
                      <DialogDescription>
                        Add a Slack workspace to sync messages to your knowledge base
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="workspaceId">Workspace ID</Label>
                        <Input
                          id="workspaceId"
                          value={workspaceId}
                          onChange={(e) => setWorkspaceId(e.target.value)}
                          placeholder="T01234ABCD"
                        />
                      </div>
                      <div>
                        <Label htmlFor="workspaceName">Workspace Name</Label>
                        <Input
                          id="workspaceName"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          placeholder="My Team Workspace"
                        />
                      </div>
                      <div>
                        <Label htmlFor="channelIds">Channel IDs (comma-separated)</Label>
                        <Input
                          id="channelIds"
                          value={channelIds}
                          onChange={(e) => setChannelIds(e.target.value)}
                          placeholder="C01234ABCD, C56789EFGH"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accessToken">Access Token</Label>
                        <Input
                          id="accessToken"
                          type="password"
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          placeholder="xoxb-..."
                        />
                      </div>
                      <Button onClick={handleAddConfig} className="w-full">
                        Connect Workspace
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {configs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No Slack workspaces connected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{config.workspace_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.channel_ids.length} channels
                        </div>
                        {config.last_sync_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Last synced: {new Date(config.last_sync_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.sync_enabled}
                          onCheckedChange={(enabled) => handleToggleSync(config.id, enabled)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(config)}
                          disabled={syncing}
                        >
                          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
              <CardDescription>History of Slack sync operations</CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No sync activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            log.status === "completed"
                              ? "default"
                              : log.status === "running"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {log.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.sync_started_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-success">{log.messages_synced} synced</span>
                        {log.messages_failed > 0 && (
                          <span className="text-destructive ml-2">
                            {log.messages_failed} failed
                          </span>
                        )}
                      </div>
                      {log.error_message && (
                        <div className="text-xs text-destructive mt-1">
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SlackSync;