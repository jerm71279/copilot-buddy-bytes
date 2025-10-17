import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SlackConfig {
  id: string;
  workspace_id: string;
  workspace_name: string;
  channel_ids: string[];
  sync_enabled: boolean;
  last_sync_at: string | null;
  access_token_encrypted: string;
}

export interface SlackSyncLog {
  id: string;
  status: string;
  messages_synced: number;
  messages_failed: number;
  sync_started_at: string;
  sync_completed_at: string | null;
  error_message: string | null;
}

export const useSlackSync = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<SlackConfig[]>([]);
  const [syncLogs, setSyncLogs] = useState<SlackSyncLog[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

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
    if (!customerId) return;

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

  const addConfig = async (
    workspaceId: string,
    workspaceName: string,
    channelIds: string,
    accessToken: string
  ) => {
    if (!customerId || !workspaceId || !workspaceName || !channelIds || !accessToken) {
      toast.error("Please fill all required fields");
      return false;
    }

    const channelIdsArray = channelIds.split(",").map(id => id.trim()).filter(id => id);

    const { error } = await supabase.from("slack_sync_config").insert({
      customer_id: customerId,
      workspace_id: workspaceId,
      workspace_name: workspaceName,
      channel_ids: channelIdsArray,
      access_token_encrypted: accessToken,
      sync_enabled: true,
    });

    if (error) {
      console.error("Error adding config:", error);
      toast.error("Failed to add Slack configuration");
      return false;
    }

    toast.success("Slack workspace connected");
    loadConfigs();
    return true;
  };

  const toggleSync = async (configId: string, enabled: boolean) => {
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

  const syncWorkspace = async (config: SlackConfig) => {
    setSyncing(true);
    try {
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

  const deleteConfig = async (configId: string) => {
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

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return {
    configs,
    syncLogs,
    syncing,
    addConfig,
    toggleSync,
    syncWorkspace,
    deleteConfig,
    signOut,
  };
};
