import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  TrendingUp,
  Clock,
  User,
  FileWarning,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string | null;
  customer_id: string | null;
  edge_function: string;
  threat_details: any;
  action_taken: string;
  created_at: string;
}

const SecurityMonitoring = () => {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [timeWindow, setTimeWindow] = useState<string>("24h");

  // Fetch recent security events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["security-events", severityFilter, timeWindow],
    queryFn: async () => {
      let query = supabase
        .from("security_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      // Calculate time window
      const now = new Date();
      const hoursAgo = timeWindow === "24h" ? 24 : timeWindow === "7d" ? 168 : 720;
      const sinceTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", sinceTime);

      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityEvent[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate statistics
  const stats = events ? {
    total: events.length,
    critical: events.filter(e => e.severity === 'critical').length,
    high: events.filter(e => e.severity === 'high').length,
    medium: events.filter(e => e.severity === 'medium').length,
    low: events.filter(e => e.severity === 'low').length,
    blocked: events.filter(e => 
      e.event_type === 'prompt_injection_blocked' || 
      e.event_type === 'tool_call_validation_failed'
    ).length,
  } : null;

  // Group by threat type
  const threatCounts = events?.reduce((acc, event) => {
    const threat = event.threat_details?.injectionType || event.event_type;
    acc[threat] = (acc[threat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topThreats = threatCounts ? 
    Object.entries(threatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) : [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            AI Security Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time threat detection and security audit logs
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={timeWindow} onValueChange={setTimeWindow}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-destructive/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Threats</p>
              <p className="text-3xl font-bold mt-1 text-destructive">{stats?.critical || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Severity</p>
              <p className="text-3xl font-bold mt-1">{stats?.high || 0}</p>
            </div>
            <FileWarning className="h-8 w-8 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-primary/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Blocked Attacks</p>
              <p className="text-3xl font-bold mt-1 text-primary">{stats?.blocked || 0}</p>
            </div>
            <Shield className="h-8 w-8 text-primary opacity-20" />
          </div>
        </Card>
      </div>

      {/* Top Threats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Threat Types
        </h2>
        <div className="space-y-3">
          {topThreats.map(([threat, count]) => (
            <div key={threat} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-mono text-sm">{threat}</span>
              </div>
              <Badge variant="outline">{count} events</Badge>
            </div>
          ))}
          {topThreats.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No threats detected in this time window
            </p>
          )}
        </div>
      </Card>

      {/* Security Events Log */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Security Events</h2>
        
        <ScrollArea className="h-[600px]">
          {eventsLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading security events...
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSeverityIcon(event.severity)}</span>
                        <Badge variant={getSeverityColor(event.severity)}>
                          {event.severity.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-sm text-muted-foreground">
                          {event.event_type}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm">
                          <strong>Edge Function:</strong> {event.edge_function}
                        </p>
                        <p className="text-sm">
                          <strong>Action:</strong> {event.action_taken}
                        </p>
                        
                        {event.threat_details && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-primary hover:underline">
                              Threat Details
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(event.threat_details, null, 2)}
                            </pre>
                          </details>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                          {event.user_id && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              User: {event.user_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground">No security events found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your AI features are secure and no threats have been detected
              </p>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default SecurityMonitoring;
