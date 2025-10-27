import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileRepositoryBrowser } from "@/components/files/FileRepositoryBrowser";
import { SharePointManager } from "@/components/files/SharePointManager";
import { OneDriveSpace } from "@/components/files/OneDriveSpace";
import { Cloud, FolderSync, RefreshCw, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";

export default function FileCollaboration() {
  const toast = useStandardToast();
  const { customerId } = useUserProfile();
  const [syncing, setSyncing] = useState(false);

  const { data: repositories, refetch: refetchRepositories } = useQuery({
    queryKey: ['file_repositories', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('file_repositories')
        .select('*')
        .eq('customer_id', customerId!)
        .order('repository_name');

      if (error) throw error;
      return data as any[];
    }
  });

  const { data: syncHistory } = useQuery({
    queryKey: ['sync_history', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('file_sync_history')
        .select('*')
        .eq('customer_id', customerId!)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as any[];
    }
  });

  const handleSyncAll = async (type: 'sharepoint_site' | 'teams_channel' | 'onedrive') => {
    if (!customerId) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('file-repository-sync', {
        body: {
          customer_id: customerId,
          repository_type: type,
          full_sync: true
        }
      });

      if (error) throw error;

      toast.success(data.message || 'Sync completed successfully');
      refetchRepositories();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error((error as any).message || 'Failed to sync files');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
              <div className="text-2xl font-bold text-success">Secure</div>
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
    </DashboardLayout>
  );
}
