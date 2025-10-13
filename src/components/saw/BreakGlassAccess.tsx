import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Key, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function BreakGlassAccess() {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [accessType, setAccessType] = useState("emergency");
  const [durationHours, setDurationHours] = useState("4");
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("customer_id, full_name")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return { ...data, user_id: user.id };
    },
  });

  // Fetch break glass requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["break-glass-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("break_glass_access")
        .select(`
          *,
          requested_by_user:user_profiles!break_glass_access_requested_by_fkey(full_name),
          approved_by_user:user_profiles!break_glass_access_approved_by_fkey(full_name),
          user:user_profiles!break_glass_access_user_id_fkey(full_name),
          device:trusted_devices(device_name, is_saw)
        `)
        .order("requested_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  // Request break glass access
  const requestAccessMutation = useMutation({
    mutationFn: async (data: any) => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(data.durationHours));

      const { error } = await supabase
        .from("break_glass_access")
        .insert({
          customer_id: currentUser?.customer_id,
          user_id: currentUser?.user_id,
          requested_by: currentUser?.user_id,
          reason: data.reason,
          access_type: data.accessType,
          expires_at: expiresAt.toISOString(),
          status: "pending"
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["break-glass-requests"] });
      toast.success("Break-glass access request submitted for approval");
      setIsRequestOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to request access: ${error.message}`);
    },
  });

  // Approve/Deny request
  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase
        .from("break_glass_access")
        .update({
          status: approve ? "approved" : "denied",
          approved_at: approve ? new Date().toISOString() : null,
          approved_by: currentUser?.user_id,
          access_granted: approve
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["break-glass-requests"] });
      toast.success(variables.approve ? "Access granted" : "Access denied");
    },
  });

  const resetForm = () => {
    setReason("");
    setAccessType("emergency");
    setDurationHours("4");
  };

  const handleRequest = () => {
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    requestAccessMutation.mutate({ reason, accessType, durationHours });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case "denied":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Denied</Badge>;
      case "expired":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Expired</Badge>;
      case "revoked":
        return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" />Revoked</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" />Pending</Badge>;
    }
  };

  const getAccessTypeBadge = (type: string) => {
    switch (type) {
      case "emergency":
        return <Badge variant="destructive">Emergency</Badge>;
      case "maintenance":
        return <Badge variant="secondary">Maintenance</Badge>;
      case "audit":
        return <Badge variant="outline">Audit</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Break-Glass Emergency Access</CardTitle>
            <CardDescription>
              Request temporary elevated access for emergency situations with approval workflow
            </CardDescription>
          </div>
          <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Key className="mr-2 h-4 w-4" />
                Request Emergency Access
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Request Break-Glass Access
                </DialogTitle>
                <DialogDescription>
                  This creates an audited request for emergency privileged access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Access Type *</Label>
                  <Select value={accessType} onValueChange={setAccessType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency Response</SelectItem>
                      <SelectItem value="maintenance">Critical Maintenance</SelectItem>
                      <SelectItem value="audit">Security Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (Hours)</Label>
                  <Input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    min="1"
                    max="24"
                  />
                </div>
                <div>
                  <Label>Justification *</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide detailed justification for emergency access..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    All break-glass access is logged and audited
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRequestOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRequest} 
                  disabled={requestAccessMutation.isPending}
                >
                  {requestAccessMutation.isPending ? "Submitting..." : "Request Access"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading requests...</p>
        ) : requests && requests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested By</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.requested_by_user?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell>{getAccessTypeBadge(request.access_type)}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(request.requested_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(request.expires_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {request.approved_by_user?.full_name || "—"}
                  </TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => approveRequestMutation.mutate({
                            id: request.id,
                            approve: true
                          })}
                          disabled={approveRequestMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => approveRequestMutation.mutate({
                            id: request.id,
                            approve: false
                          })}
                          disabled={approveRequestMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No break-glass access requests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}