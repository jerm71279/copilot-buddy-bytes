import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Layout, Copy } from "lucide-react";
import { toast } from "sonner";
import { RBACService } from "@/services/rbacService";

export default function RoleTemplates() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: ["role-templates"],
    queryFn: () => RBACService.getRoleTemplates(),
  });

  const templates = templatesResponse?.data || [];

  // Fetch roles
  const { data: rolesResponse } = useQuery({
    queryKey: ["roles"],
    queryFn: () => RBACService.getRoles(),
  });

  const roles = rolesResponse?.data || [];

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: (data: { roleId: string; permissions: any[] }) =>
      RBACService.applyRoleTemplate(data.roleId, data.permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Template applied successfully");
      setIsApplyOpen(false);
      setSelectedTemplate(null);
      setSelectedRoleId("");
    },
    onError: (error: any) => {
      toast.error(`Failed to apply template: ${error.message}`);
    },
  });

  const handleApplyTemplate = () => {
    if (!selectedRoleId) {
      toast.error("Please select a role");
      return;
    }
    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }
    applyTemplateMutation.mutate({
      roleId: selectedRoleId,
      permissions: selectedTemplate.permissions,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Templates</CardTitle>
            <CardDescription>
              Pre-configured permission sets for common roles
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading templates...</p>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: any) => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Layout className="h-5 w-5 text-primary" />
                    {template.is_system_template && (
                      <Badge variant="secondary">System</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(template.permissions) ? template.permissions.length : 0} permissions
                    </div>
                    <Dialog
                      open={isApplyOpen && selectedTemplate?.id === template.id}
                      onOpenChange={(open) => {
                        setIsApplyOpen(open);
                        if (!open) {
                          setSelectedTemplate(null);
                          setSelectedRoleId("");
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Apply to Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply Template</DialogTitle>
                          <DialogDescription>
                            Apply "{template.template_name}" to a role
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Select Role</Label>
                            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a role" />
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
                          <div className="text-sm text-muted-foreground">
                            This will replace all existing permissions for the selected role.
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsApplyOpen(false);
                              setSelectedTemplate(null);
                              setSelectedRoleId("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleApplyTemplate}
                            disabled={applyTemplateMutation.isPending}
                          >
                            {applyTemplateMutation.isPending ? "Applying..." : "Apply Template"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No role templates available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
