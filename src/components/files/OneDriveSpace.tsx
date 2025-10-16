import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, RefreshCw, ExternalLink, User } from "lucide-react";

interface Repository {
  id: string;
  repository_name: string;
  last_synced_at: string | null;
  external_url: string | null;
  is_active: boolean;
}

interface OneDriveSpaceProps {
  repositories: Repository[];
  onSync: () => Promise<void>;
  syncing: boolean;
}

export function OneDriveSpace({ repositories, onSync, syncing }: OneDriveSpaceProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                Personal OneDrive
              </CardTitle>
              <CardDescription>
                Access and sync your personal OneDrive files
              </CardDescription>
            </div>
            <Button onClick={onSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync OneDrive
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {repositories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">OneDrive not connected</p>
              <p className="text-xs">Click "Sync OneDrive" to access your files</p>
            </div>
          ) : (
            <div className="space-y-4">
              {repositories.map((repo) => (
                <Card key={repo.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{repo.repository_name}</CardTitle>
                        {repo.last_synced_at && (
                          <CardDescription className="text-xs">
                            Last synced: {new Date(repo.last_synced_at).toLocaleString()}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={repo.is_active ? 'default' : 'secondary'}>
                          {repo.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {repo.external_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(repo.external_url!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        Your personal files are synced and searchable by AI
                      </p>
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
          <CardTitle>Privacy & Security</CardTitle>
          <CardDescription>
            Your OneDrive files are private and secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Only you can access your OneDrive files</p>
            <p>✓ Files are encrypted in transit and at rest</p>
            <p>✓ AI respects your file permissions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
