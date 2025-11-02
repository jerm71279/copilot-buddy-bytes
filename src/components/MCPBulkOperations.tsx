import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckSquare, ChevronDown, Power, PowerOff, Trash2, Tag, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MCPBulkOperationsProps {
  selectedServers: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function MCPBulkOperations({ 
  selectedServers, 
  onClearSelection,
  onRefresh 
}: MCPBulkOperationsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkActivate = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('mcp_servers')
        .update({ status: 'active' })
        .in('id', selectedServers);

      if (error) throw error;

      toast.success(`Activated ${selectedServers.length} server(s)`);
      onClearSelection();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate servers');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('mcp_servers')
        .update({ status: 'inactive' })
        .in('id', selectedServers);

      if (error) throw error;

      toast.success(`Deactivated ${selectedServers.length} server(s)`);
      onClearSelection();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate servers');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedServers.length} server(s)? This cannot be undone.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('mcp_servers')
        .delete()
        .in('id', selectedServers);

      if (error) throw error;

      toast.success(`Deleted ${selectedServers.length} server(s)`);
      onClearSelection();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete servers');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedServers.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              {selectedServers.length} server{selectedServers.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkActivate}
              disabled={isProcessing}
            >
              <Power className="h-4 w-4 mr-1" />
              Activate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDeactivate}
              disabled={isProcessing}
            >
              <PowerOff className="h-4 w-4 mr-1" />
              Deactivate
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isProcessing}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
