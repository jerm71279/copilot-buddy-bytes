import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Shield, Clock } from "lucide-react";

export default function DeviceSessionsMonitor() {
  // Fetch active sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["device-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_sessions")
        .select(`
          *,
          user:user_profiles!device_sessions_user_id_fkey(full_name),
          device:trusted_devices(device_name, device_type, is_saw)
        `)
        .eq("is_active", true)
        .order("session_start", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSessionTypeBadge = (type: string) => {
    switch (type) {
      case "break_glass":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Break Glass</Badge>;
      case "privileged":
        return <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />Privileged</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Activity className="h-3 w-3" />Standard</Badge>;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 75) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 40) return <Badge variant="secondary">Medium Risk</Badge>;
    return <Badge variant="outline">Low Risk</Badge>;
  };

  const formatDuration = (start: string) => {
    const duration = Date.now() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Device Sessions</CardTitle>
            <CardDescription>
              Real-time monitoring of active sessions and privileged operations
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            {sessions?.length || 0} Active Sessions
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading sessions...</p>
        ) : sessions && sessions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Session Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session: any) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {session.user?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {session.device?.device_name || "Unknown Device"}
                      {session.device?.is_saw && (
                        <Badge variant="default" className="text-xs">SAW</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getSessionTypeBadge(session.session_type)}</TableCell>
                  <TableCell className="font-mono text-sm">{session.ip_address}</TableCell>
                  <TableCell className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(session.session_start)}
                  </TableCell>
                  <TableCell>{getRiskBadge(session.risk_score || 0)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(session.last_activity).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {Array.isArray(session.privileged_operations) && session.privileged_operations.length > 0
                      ? session.privileged_operations.length
                      : 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No active sessions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}