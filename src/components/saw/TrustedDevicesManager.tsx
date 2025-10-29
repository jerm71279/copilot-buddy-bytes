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
import { Plus, Shield, ShieldCheck, ShieldAlert, Laptop, Monitor, Smartphone, Server } from "lucide-react";
import { toast } from "sonner";
import { SAWService } from "@/services/sawService";
import { supabase } from "@/integrations/supabase/client";

// Generate device fingerprint from browser/system information
const generateDeviceFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('fingerprint', 10, 10);
  const canvasData = canvas.toDataURL();
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvasFingerprint: canvasData.substring(0, 100),
    timestamp: Date.now()
  };
  
  return btoa(JSON.stringify(fingerprint));
};

export default function TrustedDevicesManager() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("workstation");
  const [isSAW, setIsSAW] = useState(false);
  const [securityLevel, setSecurityLevel] = useState("standard");
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  // Get current user's customer_id
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch trusted devices
  const { data: devices, isLoading } = useQuery({
    queryKey: ["trusted-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trusted_devices")
        .select(`
          *,
          registered_by_profile:user_profiles!trusted_devices_registered_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Register device mutation
  const registerDeviceMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fingerprint = generateDeviceFingerprint();
      
      // Get current IP (in production, use server-side detection)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const { error } = await supabase
        .from("trusted_devices")
        .insert({
          customer_id: userProfile?.customer_id,
          device_name: data.deviceName,
          device_fingerprint: fingerprint,
          device_type: data.deviceType,
          ip_address: ip,
          operating_system: navigator.platform,
          is_saw: data.isSAW,
          security_level: data.securityLevel,
          requires_mfa: data.requiresMFA,
          notes: data.notes,
          registered_by: user.id,
          device_metadata: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trusted-devices"] });
      toast.success("Device registered successfully");
      setIsRegisterOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to register device: ${error.message}`);
    },
  });

  // Toggle device status
  const toggleDeviceMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      SAWService.toggleDevice(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trusted-devices"] });
      toast.success("Device status updated");
    },
  });

  const resetForm = () => {
    setDeviceName("");
    setDeviceType("workstation");
    setIsSAW(false);
    setSecurityLevel("standard");
    setRequiresMFA(false);
    setNotes("");
  };

  const handleRegister = () => {
    if (!deviceName.trim()) {
      toast.error("Device name is required");
      return;
    }
    registerDeviceMutation.mutate({
      deviceName,
      deviceType,
      isSAW,
      securityLevel,
      requiresMFA,
      notes
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "workstation": return <Monitor className="h-4 w-4" />;
      case "laptop": return <Laptop className="h-4 w-4" />;
      case "mobile": return <Smartphone className="h-4 w-4" />;
      case "server": return <Server className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getSecurityBadge = (level: string, isSAW: boolean) => {
    if (isSAW) {
      return <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" />SAW</Badge>;
    }
    switch (level) {
      case "privileged": return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" />Privileged</Badge>;
      case "elevated": return <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />Elevated</Badge>;
      default: return <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />Standard</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trusted Devices Registry</CardTitle>
            <CardDescription>
              Register and manage secure access workstations (SAWs) and trusted devices
            </CardDescription>
          </div>
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Register Device
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register Trusted Device</DialogTitle>
                <DialogDescription>
                  Register this device as a trusted workstation for privileged access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Device Name *</Label>
                    <Input
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="e.g., Admin Workstation 1"
                    />
                  </div>
                  <div>
                    <Label>Device Type</Label>
                    <Select value={deviceType} onValueChange={setDeviceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workstation">Workstation</SelectItem>
                        <SelectItem value="laptop">Laptop</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Security Level</Label>
                    <Select value={securityLevel} onValueChange={setSecurityLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="elevated">Elevated</SelectItem>
                        <SelectItem value="privileged">Privileged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={requiresMFA}
                      onCheckedChange={setRequiresMFA}
                      id="requires-mfa"
                    />
                    <Label htmlFor="requires-mfa">Require MFA</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isSAW}
                    onCheckedChange={setIsSAW}
                    id="is-saw"
                  />
                  <Label htmlFor="is-saw" className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Designate as Secure Access Workstation (SAW)
                  </Label>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional information about this device..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRegister} disabled={registerDeviceMutation.isPending}>
                  {registerDeviceMutation.isPending ? "Registering..." : "Register Device"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading devices...</p>
        ) : devices && devices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Security Level</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Registered By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device: any) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.device_type)}
                      {device.device_name}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{device.device_type}</TableCell>
                  <TableCell>{getSecurityBadge(device.security_level, device.is_saw)}</TableCell>
                  <TableCell className="font-mono text-sm">{device.ip_address || "N/A"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {device.last_seen_at 
                      ? new Date(device.last_seen_at).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {device.registered_by_profile?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={device.is_active ? "default" : "secondary"}>
                      {device.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={device.is_active}
                      onCheckedChange={() => toggleDeviceMutation.mutate({
                        id: device.id,
                        isActive: device.is_active
                      })}
                      disabled={toggleDeviceMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No trusted devices registered
          </div>
        )}
      </CardContent>
    </Card>
  );
}