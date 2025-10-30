import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RBACService } from "@/services/rbacService";

export default function RoleHierarchy() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [parentRoleId, setParentRoleId] = useState("");
  const [childRoleId, setChildRoleId] = useState("");
  const [inheritPermissions, setInheritPermissions] = useState(true);
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: rolesResponse } = useQuery({
    queryKey: ["roles"],
    queryFn: () => RBACService.getRoles(),
  });

  const roles = rolesResponse?.data || [];

  // Fetch role hierarchy
  const { data: hierarchiesResponse, isLoading } = useQuery({
    queryKey: ["role-hierarchy"],
    queryFn: () => RBACService.getRoleHierarchy(),
  });

  const hierarchies = hierarchiesResponse?.data || [];

  // Add hierarchy mutation
  const addHierarchyMutation = useMutation({
    mutationFn: (data: any) => RBACService.addHierarchy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-hierarchy"] });
      toast.success("Role hierarchy added successfully");
      setIsAddOpen(false);
      setParentRoleId("");
      setChildRoleId("");
      setInheritPermissions(true);
    },
    onError: (error: any) => {
      toast.error(`Failed to add hierarchy: ${error.message}`);
    },
  });

  // Delete hierarchy mutation
  const deleteHierarchyMutation = useMutation({
    mutationFn: (hierarchyId: string) => RBACService.deleteHierarchy(hierarchyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-hierarchy"] });
      toast.success("Role hierarchy removed successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to remove hierarchy: ${error.message}`);
    },
  });

  const handleAddHierarchy = () => {
    if (!parentRoleId || !childRoleId) {
      toast.error("Please select both parent and child roles");
      return;
    }
    if (parentRoleId === childRoleId) {
      toast.error("Parent and child roles must be different");
      return;
    }
    addHierarchyMutation.mutate({
      parent_role_id: parentRoleId,
      child_role_id: childRoleId,
      inherit_permissions: inheritPermissions,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Hierarchy</CardTitle>
            <CardDescription>
              Define parent-child relationships between roles with permission inheritance
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Hierarchy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Role Hierarchy</DialogTitle>
                <DialogDescription>
                  Create a parent-child relationship between two roles
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Parent Role</Label>
                  <Select value={parentRoleId} onValueChange={setParentRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Child Role</Label>
                  <Select value={childRoleId} onValueChange={setChildRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select child role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inherit"
                    checked={inheritPermissions}
                    onCheckedChange={setInheritPermissions}
                  />
                  <Label htmlFor="inherit">Inherit permissions from parent</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddHierarchy} disabled={addHierarchyMutation.isPending}>
                  {addHierarchyMutation.isPending ? "Adding..." : "Add Hierarchy"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading hierarchies...</p>
        ) : hierarchies && hierarchies.length > 0 ? (
          <div className="space-y-4">
            {hierarchies.map((hierarchy: any) => (
              <div
                key={hierarchy.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="font-medium">{hierarchy.parent_role.name}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="font-medium">{hierarchy.child_role.name}</div>
                  {hierarchy.inherit_permissions && (
                    <span className="text-sm text-muted-foreground">
                      (inherits permissions)
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteHierarchyMutation.mutate(hierarchy.id)}
                  disabled={deleteHierarchyMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No role hierarchies configured
          </div>
        )}
      </CardContent>
    </Card>
  );
}
