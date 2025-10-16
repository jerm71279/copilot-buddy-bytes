import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileRepositoryBrowser } from "@/components/files/FileRepositoryBrowser";
import { SharePointManager } from "@/components/files/SharePointManager";
import { OneDriveSpace } from "@/components/files/OneDriveSpace";
import { toast } from "sonner";
import { Cloud, FolderSync, RefreshCw, Shield } from "lucide-react";

export default function FileCollaboration() {
  const [syncing, setSyncing] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const { data: repositories, refetch: refetchRepositories } = useQuery({
    queryKey: ['file_repositories', userProfile?.customer_id],
    enabled: !!userProfile?.customer_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('file_repositories')
        .select('*')
        .eq('customer_id', userProfile!.customer_id)
        .order('repository_name');

      if (error) throw error;
      return data as any[];
    }
  });

  const { data: syncHistory } = useQuery({
    queryKey: ['sync_history', userProfile?.customer_id],
    enabled: !!userProfile?.customer_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('file_sync_history')
        .select('*')
        .eq('customer_id', userProfile!.customer_id)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as any[];
    }
  });

  const handleSyncAll = async (type: 'sharepoint_site' | 'teams_channel' | 'onedrive') => {
    if (!userProfile?.customer_id) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('file-repository-sync', {
        body: {
          customer_id: userProfile.customer_id,
          repository_type: type,
          full_sync: true
        }
      });

      if (error) throw error;

      toast.success(data.message || 'Sync completed successfully');
      refetchRepositories();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Failed to sync files');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cloud className="h-8 w-8 text-primary" />
            File Collaboration
          </h1>
          <p className="text-muted-foreground">
            Connect and sync your SharePoint, Teams, and OneDrive files
          </p>
        </div>

        <Button
          onClick={() => refetchRepositories()}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connected Repositories
            </CardTitle>
            <FolderSync className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repositories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              SharePoint, Teams, OneDrive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Syncs
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncHistory?.filter((s: any) => s.sync_status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncHistory?.[0]?.['started_at']
                ? `Last: ${new Date(syncHistory[0]['started_at']).toLocaleDateString()}`
                : 'No syncs yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Status
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Secure</div>
            <p className="text-xs text-muted-foreground">
              All files encrypted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="browser" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browser">File Browser</TabsTrigger>
          <TabsTrigger value="sharepoint">SharePoint</TabsTrigger>
          <TabsTrigger value="onedrive">OneDrive</TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="space-y-4">
          <FileRepositoryBrowser 
            repositories={repositories || []}
            onSync={handleSyncAll}
            syncing={syncing}
          />
        </TabsContent>

        <TabsContent value="sharepoint">
          <SharePointManager
            repositories={repositories?.filter((r: any) => r.repository_type === 'sharepoint_site') || []}
            onSync={() => handleSyncAll('sharepoint_site')}
            syncing={syncing}
          />
        </TabsContent>

        <TabsContent value="onedrive">
          <OneDriveSpace
            repositories={repositories?.filter((r: any) => r.repository_type === 'onedrive') || []}
            onSync={() => handleSyncAll('onedrive')}
            syncing={syncing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
