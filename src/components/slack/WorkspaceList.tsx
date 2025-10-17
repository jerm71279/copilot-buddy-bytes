import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { SlackConfig } from "@/hooks/useSlackSync";

interface WorkspaceListProps {
  configs: SlackConfig[];
  syncing: boolean;
  onToggleSync: (configId: string, enabled: boolean) => void;
  onSync: (config: SlackConfig) => void;
  onDelete: (configId: string) => void;
}

export const WorkspaceList = ({
  configs,
  syncing,
  onToggleSync,
  onSync,
  onDelete,
}: WorkspaceListProps) => {
  if (configs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No Slack workspaces connected</p>
      </div>
    );
  }

  return (
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
              onCheckedChange={(enabled) => onToggleSync(config.id, enabled)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSync(config)}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(config.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
