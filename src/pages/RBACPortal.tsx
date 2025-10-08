import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, UserMinus, Search } from "lucide-react";
import DashboardNavigation from "@/components/DashboardNavigation";

interface UserProfile {
  user_id: string;
  full_name: string;
  department: string;
  roles: { id: string; name: string }[];
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function RBACPortal() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users-rbac"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("user_id, full_name, department");

      if (profilesError) throw profilesError;

      const usersWithRoles: UserProfile[] = await Promise.all(
        profiles.map(async (profile) => {
          const { data: userRoles, error: rolesError } = await supabase
            .from("user_roles")
            .select("role_id, roles(id, name)")
            .eq("user_id", profile.user_id);

          if (rolesError) throw rolesError;

          return {
            ...profile,
            roles: userRoles.map((ur: any) => ({
              id: ur.roles.id,
              name: ur.roles.name,
            })),
          };
        })
      );

      return usersWithRoles;
    },
  });

  // Fetch all available roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Role[];
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-rbac"] });
      toast({
        title: "Role assigned",
        description: "The role has been successfully assigned to the user.",
      });
      setSelectedRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-rbac"] });
      toast({
        title: "Role removed",
        description: "The role has been successfully removed from the user.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRole = () => {
    if (selectedUser && selectedRole) {
      assignRoleMutation.mutate({ userId: selectedUser, roleId: selectedRole });
    }
  };

  const handleRemoveRole = (userId: string, roleId: string) => {
    removeRoleMutation.mutate({ userId, roleId });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">RBAC Management Portal</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions across the organization
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {["Total Users", "Active Roles", "Super Admins", "Pending Assignments"].map(
            (label, idx) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {idx === 0
                      ? users.length
                      : idx === 1
                      ? roles.length
                      : idx === 2
                      ? users.filter((u) =>
                          u.roles.some((r) => r.name === "Super Admin")
                        ).length
                      : 0}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>User Role Assignments</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading || rolesLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Assigned Roles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.full_name || "Unknown User"}
                        </TableCell>
                        <TableCell>{user.department || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge
                                  key={role.id}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {role.name}
                                  <button
                                    onClick={() =>
                                      handleRemoveRole(user.user_id, role.id)
                                    }
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <UserMinus className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No roles assigned
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={
                                selectedUser === user.user_id ? selectedRole : ""
                              }
                              onValueChange={(value) => {
                                setSelectedUser(user.user_id);
                                setSelectedRole(value);
                              }}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles
                                  .filter(
                                    (role) =>
                                      !user.roles.some((ur) => ur.id === role.id)
                                  )
                                  .map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={handleAssignRole}
                              disabled={
                                !selectedRole || selectedUser !== user.user_id
                              }
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                    <div className="mt-4">
                      <Badge variant="outline">
                        {users.filter((u) =>
                          u.roles.some((r) => r.id === role.id)
                        ).length}{" "}
                        users
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
