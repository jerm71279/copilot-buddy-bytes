import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, TrendingDown, Zap, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AICacheService, CacheMetrics } from "@/services/aiCacheService";

export const CacheMetricsCard = () => {
  const [metrics, setMetrics] = useState<CacheMetrics>({
    totalHits: 0,
    totalCached: 0,
    avgProcessingTime: 0,
    estimatedSavings: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCacheMetrics();
  }, []);

  const fetchCacheMetrics = async () => {
    try {
      const metrics = await AICacheService.getCacheMetrics();
      setMetrics(metrics);
    } catch (error) {
      console.error("Error fetching cache metrics:", error);
      toast({
        title: "Failed to load metrics",
        description: "Could not retrieve cache statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Prompt Caching Metrics
        </CardTitle>
        <CardDescription>
          Real-time statistics showing cost savings and performance improvements from intelligent prompt caching
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              icon={Zap}
              label="Cache Hits"
              value={metrics.totalHits}
              color="bg-[hsl(var(--success))]"
            />
            <MetricCard
              icon={Database}
              label="Cached Prompts"
              value={metrics.totalCached}
              color="bg-primary"
            />
            <MetricCard
              icon={Clock}
              label="Avg. Speed Boost"
              value={`${metrics.avgProcessingTime}ms`}
              color="bg-[hsl(var(--warning))]"
            />
            <MetricCard
              icon={TrendingDown}
              label="Est. Cost Savings"
              value={`$${metrics.estimatedSavings.toFixed(2)}`}
              color="bg-[hsl(var(--accent))]"
            />
          </div>
        )}
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">How Prompt Caching Works</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• System prompts and repetitive contexts are cached for 24 hours</li>
            <li>• Cached prompts return 2-5x faster than uncached requests</li>
            <li>• Saves up to 90% on AI costs for repeated operations</li>
            <li>• Automatically applied to Pattern Executions and Workflow Intelligence</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
