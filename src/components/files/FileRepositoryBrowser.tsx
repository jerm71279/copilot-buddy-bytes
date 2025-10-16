import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, Cloud, RefreshCw, ExternalLink } from "lucide-react";

interface Repository {
  id: string;
  repository_name: string;
  repository_type: string;
  last_synced_at: string | null;
  external_url: string | null;
  is_active: boolean;
}

interface FileRepositoryBrowserProps {
  repositories: Repository[];
  onSync: (type: 'sharepoint_site' | 'teams_channel' | 'onedrive') => Promise<void>;
  syncing: boolean;
}

export function FileRepositoryBrowser({ repositories, onSync, syncing }: FileRepositoryBrowserProps) {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const getRepoIcon = (type: string) => {
    switch (type) {
      case 'sharepoint_site':
        return <Cloud className="h-5 w-5 text-primary" />;
      case 'teams_channel':
        return <FolderOpen className="h-5 w-5 text-secondary" />;
      case 'onedrive':
        return <FileText className="h-5 w-5 text-accent" />;
      default:
        return <Cloud className="h-5 w-5" />;
    }
  };

  const getRepoTypeName = (type: string) => {
    switch (type) {
      case 'sharepoint_site':
        return 'SharePoint';
      case 'teams_channel':
        return 'Teams';
      case 'onedrive':
        return 'OneDrive';
      default:
        return type;
    }
  };

  if (repositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Repositories Connected</CardTitle>
          <CardDescription>
            Connect your Microsoft 365 account to start syncing files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => onSync('sharepoint_site')} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync SharePoint
            </Button>
            <Button onClick={() => onSync('onedrive')} disabled={syncing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync OneDrive
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {repositories.map((repo) => (
          <Card
            key={repo.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRepo === repo.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRepo(repo.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getRepoIcon(repo.repository_type)}
                  <div>
                    <CardTitle className="text-lg">{repo.repository_name}</CardTitle>
                    <CardDescription className="text-xs">
                      {getRepoTypeName(repo.repository_type)}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={repo.is_active ? 'default' : 'secondary'}>
                  {repo.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {repo.last_synced_at && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(repo.last_synced_at).toLocaleString()}
                  </p>
                )}
                {repo.external_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(repo.external_url!, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Microsoft 365
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRepo && (
        <Card>
          <CardHeader>
            <CardTitle>Files & Folders</CardTitle>
            <CardDescription>
              Browse files from {repositories.find(r => r.id === selectedRepo)?.repository_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">File browser coming soon</p>
                <p className="text-xs">Files are being synced to the knowledge base</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
