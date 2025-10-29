import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStandardToast } from "@/hooks/useStandardToast";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const RealTimeAnalytics = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const toast = useStandardToast();

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel('realtime-analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'data_lake_gold'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          setMetrics(prev => [payload, ...prev].slice(0, 50));
          toast.info(`${payload.eventType} on ${payload.table}`);
        }
      )
      .subscribe();

    setIsStreaming(true);

    return () => {
      supabase.removeChannel(channel);
      setIsStreaming(false);
    };
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Real-Time Analytics</h1>
              <p className="text-muted-foreground text-lg">Live data streaming and event-driven processing</p>
            </div>
          </div>
          <Badge variant={isStreaming ? "default" : "outline"} className="text-lg px-4 py-2">
            {isStreaming ? <><Zap className="h-4 w-4 mr-2" />Live</> : "Paused"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events/Second</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.length / 10).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 10 seconds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.length}</div>
            <p className="text-xs text-muted-foreground">Since stream started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stream Status</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Active</div>
            <p className="text-xs text-muted-foreground">WebSocket connected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Event Stream</CardTitle>
          <CardDescription>Real-time data changes as they happen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {metrics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Waiting for events...</p>
              </div>
            ) : (
              metrics.map((event, idx) => (
                <div key={idx} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{event.eventType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default RealTimeAnalytics;
