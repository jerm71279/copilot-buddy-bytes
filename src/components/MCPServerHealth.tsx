import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface ServerHealth {
  server_id: string;
  server_name: string;
  endpoint_url: string | null;
  total_executions: number;
  successful_executions: number;
  avg_execution_time: number;
  last_execution: string;
  health_score: number;
  status: 'healthy' | 'degraded' | 'error' | 'inactive';
}

export function MCPServerHealth({ customerId }: { customerId?: string }) {
  const [healthData, setHealthData] = useState<ServerHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [customerId]);

  const fetchHealthData = async () => {
    try {
      // Get server execution statistics
      const { data: stats, error } = await supabase
        .from('mcp_execution_logs')
        .select(`
          server_id,
          status,
          execution_time_ms,
          created_at,
          mcp_servers (
            id,
            server_name,
            endpoint_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate health metrics per server
      const serverMap = new Map<string, ServerHealth>();
      
      stats?.forEach((log: any) => {
        const server = log.mcp_servers;
        if (!server) return;

        if (!serverMap.has(server.id)) {
          serverMap.set(server.id, {
            server_id: server.id,
            server_name: server.server_name,
            endpoint_url: server.endpoint_url,
            total_executions: 0,
            successful_executions: 0,
            avg_execution_time: 0,
            last_execution: log.created_at,
            health_score: 100,
            status: 'healthy'
          });
        }

        const health = serverMap.get(server.id)!;
        health.total_executions++;
        if (log.status === 'success') health.successful_executions++;
        health.avg_execution_time += log.execution_time_ms;
      });

      // Calculate final metrics
      const healthArray = Array.from(serverMap.values()).map(health => {
        health.avg_execution_time = health.total_executions > 0 
          ? Math.round(health.avg_execution_time / health.total_executions)
          : 0;

        const successRate = health.total_executions > 0
          ? (health.successful_executions / health.total_executions) * 100
          : 100;

        health.health_score = Math.round(successRate);

        // Determine status
        if (!health.endpoint_url) {
          health.status = 'inactive';
        } else if (health.health_score >= 90) {
          health.status = 'healthy';
        } else if (health.health_score >= 70) {
          health.status = 'degraded';
        } else {
          health.status = 'error';
        }

        return health;
      });

      setHealthData(healthArray);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      healthy: 'default',
      degraded: 'secondary',
      error: 'destructive',
      inactive: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading health data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          MCP Server Health Monitor
        </CardTitle>
        <CardDescription>
          Real-time health metrics for connected MCP servers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No health data available. Execute some MCP tools to see metrics.
          </p>
        ) : (
          healthData.map(health => (
            <div key={health.server_id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.status)}
                  <span className="font-semibold">{health.server_name}</span>
                </div>
                {getStatusBadge(health.status)}
              </div>

              {health.endpoint_url && (
                <p className="text-xs text-muted-foreground font-mono">
                  {health.endpoint_url}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Health Score</span>
                  <span className="font-semibold">{health.health_score}%</span>
                </div>
                <Progress value={health.health_score} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Executions</p>
                  <p className="font-semibold">{health.total_executions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Success Rate</p>
                  <p className="font-semibold">
                    {health.total_executions > 0 
                      ? `${Math.round((health.successful_executions / health.total_executions) * 100)}%`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Avg Time
                  </p>
                  <p className="font-semibold">{health.avg_execution_time}ms</p>
                </div>
              </div>

              {health.last_execution && (
                <p className="text-xs text-muted-foreground">
                  Last execution: {new Date(health.last_execution).toLocaleString()}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
