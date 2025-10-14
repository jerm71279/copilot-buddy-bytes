import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Activity, AlertTriangle, Search, Filter, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: string;
  source: string;
  user_id?: string;
  ip_address?: string;
  description: string;
  raw_data: any;
}

const SIEMDashboard = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  // Fetch aggregated security events from multiple sources
  const { data: events, isLoading } = useQuery({
    queryKey: ['siem-events', timeRange, severityFilter, eventTypeFilter, searchQuery],
    queryFn: async () => {
      const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      // Fetch from multiple sources
      const [alerts, behavioral, audit, anomalies] = await Promise.all([
        supabase.from('security_alerts' as any).select('*').gte('created_at', since),
        supabase.from('behavioral_events').select('*').gte('created_at', since),
        supabase.from('audit_logs').select('*').gte('created_at', since),
        supabase.from('anomaly_detections').select('*').gte('created_at', since),
      ]);

      // Normalize events from different sources
      const normalized: SecurityEvent[] = [];

      alerts.data?.forEach((a: any) => normalized.push({
        id: a.id,
        timestamp: a.created_at,
        event_type: 'security_alert',
        severity: a.severity,
        source: 'Security Alerts',
        description: a.alert_name,
        raw_data: a,
      }));

      behavioral.data?.forEach(b => normalized.push({
        id: b.id,
        timestamp: b.timestamp,
        event_type: 'behavioral',
        severity: 'info',
        source: b.system_name,
        user_id: b.user_id,
        description: `${b.action} on ${b.system_name}`,
        raw_data: b,
      }));

      audit.data?.forEach(a => normalized.push({
        id: a.id,
        timestamp: a.timestamp,
        event_type: 'audit',
        severity: 'info',
        source: a.system_name,
        user_id: a.user_id,
        description: a.action_type,
        raw_data: a,
      }));

      anomalies.data?.forEach(a => normalized.push({
        id: a.id,
        timestamp: a.created_at,
        event_type: 'anomaly',
        severity: a.severity,
        source: a.system_name,
        user_id: a.affected_user_id,
        description: a.description,
        raw_data: a,
      }));

      // Sort by timestamp desc
      return normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });

  // Fetch SIEM metrics
  const { data: metrics } = useQuery({
    queryKey: ['siem-metrics', timeRange],
    queryFn: async () => {
      const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const [alertCount, anomalyCount, eventCount] = await Promise.all([
        supabase.from('security_alerts' as any).select('*', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('anomaly_detections').select('*', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('behavioral_events').select('*', { count: 'exact', head: true }).gte('created_at', since),
      ]);

      return {
        total_events: (eventCount.count || 0) + (alertCount.count || 0) + (anomalyCount.count || 0),
        security_alerts: alertCount.count || 0,
        anomalies: anomalyCount.count || 0,
        events_per_hour: Math.round(((eventCount.count || 0) + (alertCount.count || 0)) / hoursAgo),
      };
    },
  });

  const filteredEvents = events?.filter(event => {
    if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
    if (eventTypeFilter !== 'all' && event.event_type !== eventTypeFilter) return false;
    if (searchQuery && !event.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  const getSeverityColor = (severity: string): "default" | "destructive" | "outline" | "secondary" => {
    const map: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'outline',
      info: 'outline',
    };
    return map[severity] || 'default';
  };

  const exportEvents = () => {
    const csv = [
      ['Timestamp', 'Type', 'Severity', 'Source', 'Description'].join(','),
      ...filteredEvents.map(e => [
        e.timestamp,
        e.event_type,
        e.severity,
        e.source,
        `"${e.description.replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siem-events-${new Date().toISOString()}.csv`;
    a.click();
    
    toast({
      title: 'Export Complete',
      description: `Exported ${filteredEvents.length} events`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            SIEM Dashboard
          </h1>
          <p className="text-muted-foreground">Security Information and Event Management</p>
        </div>
        <Button onClick={exportEvents}>
          <Download className="h-4 w-4 mr-2" />
          Export Events
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_events || 0}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.security_alerts || 0}</div>
            <p className="text-xs text-muted-foreground">Active threats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.anomalies || 0}</div>
            <p className="text-xs text-muted-foreground">Behavioral anomalies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events/Hour</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.events_per_hour || 0}</div>
            <p className="text-xs text-muted-foreground">Average rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Event Search & Filtering</CardTitle>
          <CardDescription>Search and filter security events across all sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="security_alert">Alerts</SelectItem>
                <SelectItem value="anomaly">Anomalies</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Event Stream */}
      <Card>
        <CardHeader>
          <CardTitle>Security Event Stream</CardTitle>
          <CardDescription>
            {filteredEvents.length} events {searchQuery || severityFilter !== 'all' || eventTypeFilter !== 'all' ? 'matching filters' : 'total'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading events...</p>
            ) : filteredEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No events found</p>
            ) : (
              filteredEvents.slice(0, 100).map((event) => (
                <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge variant="outline">{event.event_type}</Badge>
                      <span className="text-sm font-medium">{event.description}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                      <span>Source: {event.source}</span>
                      {event.user_id && <span>User: {event.user_id}</span>}
                      {event.ip_address && <span>IP: {event.ip_address}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Reporting */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="correlation">Event Correlation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Distribution</CardTitle>
              <CardDescription>Security events by type and severity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Event analytics and visualizations coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Monitoring</CardTitle>
              <CardDescription>Security event compliance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">SOC 2 Type II</span>
                  <Badge variant="outline">Monitoring Active</Badge>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">ISO 27001</span>
                  <Badge variant="outline">Monitoring Active</Badge>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">NIST CSF</span>
                  <Badge variant="outline">Monitoring Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Correlation Rules</CardTitle>
              <CardDescription>Automated event correlation and threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Advanced correlation rules and AI-powered threat detection</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SIEMDashboard;
