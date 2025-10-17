import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddWorkspaceDialogProps {
  onAddWorkspace: (
    workspaceId: string,
    workspaceName: string,
    channelIds: string,
    accessToken: string
  ) => Promise<boolean>;
}

export const AddWorkspaceDialog = ({ onAddWorkspace }: AddWorkspaceDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [channelIds, setChannelIds] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const handleSubmit = async () => {
    const success = await onAddWorkspace(workspaceId, workspaceName, channelIds, accessToken);
    if (success) {
      setIsOpen(false);
      setWorkspaceId("");
      setWorkspaceName("");
      setChannelIds("");
      setAccessToken("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Workspace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Slack Workspace</DialogTitle>
          <DialogDescription>
            Add a Slack workspace to sync messages to your knowledge base
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="workspaceId">Workspace ID</Label>
            <Input
              id="workspaceId"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="T01234ABCD"
            />
          </div>
          <div>
            <Label htmlFor="workspaceName">Workspace Name</Label>
            <Input
              id="workspaceName"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="My Team Workspace"
            />
          </div>
          <div>
            <Label htmlFor="channelIds">Channel IDs (comma-separated)</Label>
            <Input
              id="channelIds"
              value={channelIds}
              onChange={(e) => setChannelIds(e.target.value)}
              placeholder="C01234ABCD, C56789EFGH"
            />
          </div>
          <div>
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="xoxb-..."
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Connect Workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
