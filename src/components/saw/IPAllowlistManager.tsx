import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Network, ShieldAlert, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SAWService } from "@/services/sawService";
import { AuthService } from "@/services/authService";

export default function IPAllowlistManager() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [ipRange, setIpRange] = useState("");
  const [description, setDescription] = useState("");
  const [allowlistType, setAllowlistType] = useState("standard");
  const [expiresAt, setExpiresAt] = useState("");
  const queryClient = useQueryClient();

  // Get current user's customer_id
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");
      
      const profile = await AuthService.getUserProfile(user.id);
      if (!profile) throw new Error("Profile not found");
      
      return profile;
    },
  });

  // Fetch IP allowlist
  const { data: allowlistResponse, isLoading } = useQuery({
    queryKey: ["ip-allowlist"],
    queryFn: () => SAWService.getIPAllowlist(),
  });
  
  const allowlist = allowlistResponse?.data;

  // Add IP range mutation
  const addIPMutation = useMutation({
    mutationFn: async (data: any) => {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      return SAWService.addIPToAllowlist({
        customer_id: userProfile?.customer_id,
        ip_range: data.ipRange,
        description: data.description,
        allowlist_type: data.allowlistType,
        expires_at: data.expiresAt || null,
        created_by: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-allowlist"] });
      toast.success("IP range added to allowlist");
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to add IP range: ${error.message}`);
    },
  });

  // Toggle IP status
  const toggleIPMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      SAWService.toggleIPStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-allowlist"] });
      toast.success("IP allowlist status updated");
    },
  });

  const resetForm = () => {
    setIpRange("");
    setDescription("");
    setAllowlistType("standard");
    setExpiresAt("");
  };

  const handleAdd = () => {
    if (!ipRange.trim()) {
      toast.error("IP range is required (e.g., 192.168.1.0/24)");
      return;
    }
    addIPMutation.mutate({
      ipRange,
      description,
      allowlistType,
      expiresAt
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "privileged":
        return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" />Privileged</Badge>;
      case "admin":
        return <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Network className="h-3 w-3" />Standard</Badge>;
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>IP Address Allowlist</CardTitle>
            <CardDescription>
              Restrict privileged access to specific IP ranges and VPN endpoints
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add IP Range
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add IP Range to Allowlist</DialogTitle>
                <DialogDescription>
                  Define IP ranges that are authorized for privileged operations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>IP Range (CIDR Notation) *</Label>
                  <Input
                    value={ipRange}
                    onChange={(e) => setIpRange(e.target.value)}
                    placeholder="e.g., 192.168.1.0/24 or 10.0.0.0/8"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use CIDR notation. Single IP: /32 (e.g., 203.0.113.1/32)
                  </p>
                </div>
                <div>
                  <Label>Allowlist Type</Label>
                  <Select value={allowlistType} onValueChange={setAllowlistType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Access</SelectItem>
                      <SelectItem value="admin">Admin Access</SelectItem>
                      <SelectItem value="privileged">Privileged Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Corporate VPN endpoint"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Expires At (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={addIPMutation.isPending}>
                  {addIPMutation.isPending ? "Adding..." : "Add to Allowlist"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading allowlist...</p>
        ) : allowlist && allowlist.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Range</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allowlist.map((entry: any) => {
                const expired = isExpired(entry.expires_at);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">{entry.ip_range}</TableCell>
                    <TableCell>{getTypeBadge(entry.allowlist_type)}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {entry.expires_at ? (
                        <div className={expired ? "text-destructive flex items-center gap-1" : ""}>
                          {expired && <AlertCircle className="h-3 w-3" />}
                          {new Date(entry.expires_at).toLocaleDateString()}
                        </div>
                      ) : (
                        "Never"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.created_by_profile?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.is_active && !expired ? "default" : "secondary"}>
                        {expired ? "Expired" : entry.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={entry.is_active}
                        onCheckedChange={() => toggleIPMutation.mutate({
                          id: entry.id,
                          isActive: entry.is_active
                        })}
                        disabled={toggleIPMutation.isPending || expired}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No IP ranges in allowlist
          </div>
        )}
      </CardContent>
    </Card>
  );
}