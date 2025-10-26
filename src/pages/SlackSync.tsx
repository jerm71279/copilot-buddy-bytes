import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, MessageSquare } from "lucide-react";
import DashboardNavigation from "@/components/DashboardNavigation";
import { useSlackSync } from "@/hooks/useSlackSync";
import { AddWorkspaceDialog } from "@/components/slack/AddWorkspaceDialog";
import { WorkspaceList } from "@/components/slack/WorkspaceList";
import { SyncActivityLog } from "@/components/slack/SyncActivityLog";
import { PageContainer } from "@/components/shared/PageContainer";

const SlackSync = () => {
  const {
    configs,
    syncLogs,
    syncing,
    addConfig,
    toggleSync,
    syncWorkspace,
    deleteConfig,
    signOut,
  } = useSlackSync();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Slack Sync</h1>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <PageContainer>
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
                <AddWorkspaceDialog onAddWorkspace={addConfig} />
              </div>
            </CardHeader>
            <CardContent>
              <WorkspaceList
                configs={configs}
                syncing={syncing}
                onToggleSync={toggleSync}
                onSync={syncWorkspace}
                onDelete={deleteConfig}
              />
            </CardContent>
          </Card>

          {/* Sync Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
              <CardDescription>History of Slack sync operations</CardDescription>
            </CardHeader>
            <CardContent>
              <SyncActivityLog logs={syncLogs} />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
};

export default SlackSync;