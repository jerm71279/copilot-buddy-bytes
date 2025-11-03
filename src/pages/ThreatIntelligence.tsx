import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Shield, Database, RefreshCw, AlertTriangle, Globe, FileCode, Activity, FileWarning, FileText, Mail } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";
import { useOperationsFunctions } from "@/hooks/useOperationsFunctions";

interface ThreatFeed {
  id: string;
  customer_id: string;
  feed_name: string;
  feed_type: string;
  feed_source: string;
  update_frequency: string;
  last_updated?: string;
  indicator_count: number;
  is_active: boolean;
  created_at: string;
}

interface ThreatIndicator {
  id: string;
  customer_id: string;
  feed_id?: string;
  indicator_type: string;
  indicator_value: string;
  threat_type?: string;
  severity?: string;
  confidence_score?: number;
  first_seen: string;
  last_seen: string;
  matched_count: number;
  is_active: boolean;
  tags?: string[];
}

export default function ThreatIntelligence() {
  const navigate = useNavigate();
  const toast = useStandardToast();
  const { customerId } = useUserProfile();
  const { threatIntelSync } = useOperationsFunctions();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: feeds = [], isLoading: feedsLoading } = useQuery<ThreatFeed[]>({
    queryKey: ['threat-feeds', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threat_intel_feeds' as any)
        .select('*')
        .eq('customer_id', customerId)
        .order('feed_name');
      
      if (error) throw error;
      return (data || []) as unknown as ThreatFeed[];
    },
    enabled: !!customerId,
  });

  const { data: indicators = [], isLoading: indicatorsLoading } = useQuery<ThreatIndicator[]>({
    queryKey: ['threat-indicators', customerId, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('threat_intel_indicators' as any)
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('last_seen', { ascending: false })
        .limit(100);

      if (searchQuery) {
        query = query.ilike('indicator_value', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as unknown as ThreatIndicator[];
    },
    enabled: !!customerId,
  });

  const syncFeed = useMutation({
    mutationFn: async (feedId: string) => {
      const data = await threatIntelSync.invoke({ feedId });
      if (!data) throw new Error('Sync failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['threat-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['threat-indicators'] });
      toast.success("Feed synced successfully", {
        description: `Synced ${data.indicators_synced} indicators from ${data.feed_name}`
      });
    },
    onError: (error) => {
      toast.error("Sync failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ip': return <Globe className="h-4 w-4" />;
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'url': return <Globe className="h-4 w-4" />;
      case 'file_hash': return <FileCode className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity?: string): any => {
    const colors: Record<string, any> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    return colors[severity || ''] || 'outline';
  };

  const totalIndicators = feeds.reduce((sum, feed) => sum + feed.indicator_count, 0);
  const activeFeeds = feeds.filter(f => f.is_active).length;
  const highConfidenceIndicators = indicators.filter(i => (i.confidence_score || 0) >= 80).length;

  if (feedsLoading || indicatorsLoading) {
    return (
      <DashboardLayout>
        <div>Loading threat intelligence...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* SOC Navigation */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/soc')}>
          <Shield className="h-4 w-4 mr-2" />
          SOC Dashboard
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/alerts')}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Alerts
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/incidents')}>
          <FileWarning className="h-4 w-4 mr-2" />
          Incidents
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/security/threat-intel')}>
          <Database className="h-4 w-4 mr-2" />
          Threat Intel
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/playbooks')}>
          <FileText className="h-4 w-4 mr-2" />
          Playbooks
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/siem')}>
          <Activity className="h-4 w-4 mr-2" />
          SIEM
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/endpoint')}>
          <Shield className="h-4 w-4 mr-2" />
          EDR
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/security/email')}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Threat Intelligence</h1>
          <p className="text-muted-foreground">Real-time threat feeds and indicators of compromise</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Feeds</p>
              <p className="text-2xl font-bold">{activeFeeds}</p>
            </div>
            <Database className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Indicators</p>
              <p className="text-2xl font-bold">{totalIndicators}</p>
            </div>
            <Shield className="h-8 w-8 text-secondary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Confidence</p>
              <p className="text-2xl font-bold">{highConfidenceIndicators}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Matches (30d)</p>
              <p className="text-2xl font-bold">{indicators.filter(i => i.matched_count > 0).length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="indicators">
        <TabsList>
          <TabsTrigger value="indicators">Indicators ({indicators.length})</TabsTrigger>
          <TabsTrigger value="feeds">Feeds ({feeds.length})</TabsTrigger>
        </TabsList>

        {/* Indicators Tab */}
        <TabsContent value="indicators" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search indicators (IP, domain, hash...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid gap-3">
            {indicators.map((indicator) => (
              <Card key={indicator.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(indicator.indicator_type)}
                      <code className="font-mono text-sm">{indicator.indicator_value}</code>
                      <Badge>{indicator.indicator_type}</Badge>
                      {indicator.threat_type && (
                        <Badge variant="outline">{indicator.threat_type}</Badge>
                      )}
                      {indicator.severity && (
                        <Badge variant={getSeverityColor(indicator.severity)}>{indicator.severity}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>First seen: {format(new Date(indicator.first_seen), 'MMM dd, yyyy')}</span>
                      <span>Last seen: {format(new Date(indicator.last_seen), 'MMM dd, yyyy')}</span>
                      {indicator.confidence_score && (
                        <span>Confidence: {indicator.confidence_score}%</span>
                      )}
                      {indicator.matched_count > 0 && (
                        <Badge variant="destructive">Matched {indicator.matched_count} times</Badge>
                      )}
                    </div>
                    {indicator.tags && indicator.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {indicator.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {indicators.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No indicators found. Sync a feed to populate indicators.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Feeds Tab */}
        <TabsContent value="feeds" className="space-y-4">
          <div className="grid gap-4">
            {feeds.map((feed) => (
              <Card key={feed.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-5 w-5" />
                      <h3 className="font-semibold text-lg">{feed.feed_name}</h3>
                      <Badge variant={feed.is_active ? 'default' : 'outline'}>
                        {feed.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{feed.feed_source}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium">{feed.feed_type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Update Frequency</p>
                        <p className="font-medium">{feed.update_frequency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Indicators</p>
                        <p className="font-medium">{feed.indicator_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Updated</p>
                        <p className="font-medium">
                          {feed.last_updated 
                            ? format(new Date(feed.last_updated), 'MMM dd, yyyy HH:mm')
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => syncFeed.mutate(feed.id)}
                    disabled={syncFeed.isPending}
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncFeed.isPending ? 'animate-spin' : ''}`} />
                    Sync Now
                  </Button>
                </div>
              </Card>
            ))}
            {feeds.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No threat intelligence feeds configured.</p>
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to configure feeds like AlienVault OTX, AbuseIPDB, or URLhaus.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}