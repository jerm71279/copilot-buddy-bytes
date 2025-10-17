import { Badge } from "@/components/ui/badge";
import { SlackSyncLog } from "@/hooks/useSlackSync";

interface SyncActivityLogProps {
  logs: SlackSyncLog[];
}

export const SyncActivityLog = ({ logs }: SyncActivityLogProps) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No sync activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
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
  );
};
