import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, RefreshCw, ExternalLink, Building } from "lucide-react";

interface Repository {
  id: string;
  repository_name: string;
  last_synced_at: string | null;
  external_url: string | null;
  is_active: boolean;
  metadata: any;
}

interface SharePointManagerProps {
  repositories: Repository[];
  onSync: () => Promise<void>;
  syncing: boolean;
}

export function SharePointManager({ repositories, onSync, syncing }: SharePointManagerProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                SharePoint Sites
              </CardTitle>
              <CardDescription>
                Manage your SharePoint document libraries and sites
              </CardDescription>
            </div>
            <Button onClick={onSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync SharePoint
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {repositories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No SharePoint sites connected</p>
              <p className="text-xs">Click "Sync SharePoint" to discover your sites</p>
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
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Knowledge Integration</CardTitle>
          <CardDescription>
            Your SharePoint files are automatically indexed for AI search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Files are synced to the knowledge base</p>
            <p>✓ AI can search and reference your documents</p>
            <p>✓ Ask questions about any SharePoint file</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
