import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, RefreshCw, Database } from "lucide-react";
import { useIntegrationFunctions } from "@/hooks/useIntegrationFunctions";

interface KeeperConfigProps {
  integrationId: string;
}

export function KeeperConfig({ integrationId }: KeeperConfigProps) {
  const [folderFilter, setFolderFilter] = useState("");
  const { toast } = useToast();
  const { keeperSync } = useIntegrationFunctions();

  const handleSync = async () => {
    const data = await keeperSync.invoke({
      integration_id: integrationId,
      folder_filter: folderFilter || null,
    });

    if (data) {
      toast({
        title: "Sync Complete",
        description: `Synced ${data.synced} credentials from Keeper${data.errors > 0 ? ` (${data.errors} errors)` : ''}`,
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Key className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Keeper Security Integration</h3>
            <p className="text-sm text-muted-foreground">
              Sync credentials from your Keeper vault to platform storage
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folderFilter">Folder Filter (Optional)</Label>
            <Input
              id="folderFilter"
              placeholder="e.g., Production/API Keys"
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to sync all folders, or specify a path to sync only that folder
            </p>
          </div>

          <Button
            onClick={handleSync}
            disabled={keeperSync.isLoading}
            className="w-full"
          >
            {keeperSync.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing from Keeper...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Credentials
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Database className="h-4 w-4" />
            How It Works
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Credentials are synced from Keeper vault to platform storage</li>
            <li>Keeper remains the source of truth - edit credentials in Keeper</li>
            <li>Synced credentials are encrypted and stored securely</li>
            <li>Access is logged for compliance and audit purposes</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
