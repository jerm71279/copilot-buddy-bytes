import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderPlus, Edit2, Trash2, Folder } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

interface ServerGroup {
  id: string;
  group_name: string;
  description: string | null;
  color: string;
  server_count?: number;
}

export function MCPServerGroups({ customerId }: { customerId: string }) {
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ServerGroup | null>(null);
  const [formData, setFormData] = useState({
    group_name: "",
    description: "",
    color: "#3b82f6"
  });

  useEffect(() => {
    fetchGroups();
  }, [customerId]);

  const fetchGroups = async () => {
    try {
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('mcp_server_groups')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch server counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('mcp_servers')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return { ...group, server_count: count || 0 };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load server groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGroup) {
        // Update existing group
        const { error } = await supabase
          .from('mcp_server_groups')
          .update(formData)
          .eq('id', editingGroup.id);

        if (error) throw error;
        toast.success('Group updated successfully');
      } else {
        // Create new group
        const { error } = await supabase
          .from('mcp_server_groups')
          .insert([{ ...formData, customer_id: customerId }]);

        if (error) throw error;
        toast.success('Group created successfully');
      }

      setIsDialogOpen(false);
      setEditingGroup(null);
      setFormData({ group_name: "", description: "", color: "#3b82f6" });
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save group');
    }
  };

  const handleEdit = (group: ServerGroup) => {
    setEditingGroup(group);
    setFormData({
      group_name: group.group_name,
      description: group.description || "",
      color: group.color
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Delete this group? Servers in this group will not be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mcp_server_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const resetForm = () => {
    setEditingGroup(null);
    setFormData({ group_name: "", description: "", color: "#3b82f6" });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading groups...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Server Groups</CardTitle>
            <CardDescription>Organize your MCP servers into logical groups</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGroup ? 'Edit' : 'Create'} Server Group</DialogTitle>
                <DialogDescription>
                  {editingGroup ? 'Update' : 'Create a new'} group to organize your MCP servers
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group_name">Group Name</Label>
                  <Input
                    id="group_name"
                    value={formData.group_name}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    placeholder="Production Servers"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Servers used in production environment"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-muted-foreground">{formData.color}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingGroup ? 'Update' : 'Create'} Group
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No groups yet. Create your first group to organize servers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <h3 className="font-semibold">{group.group_name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(group)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(group.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mb-2">{group.description}</p>
                  )}
                  <Badge variant="secondary">
                    {group.server_count} server{group.server_count !== 1 ? 's' : ''}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
