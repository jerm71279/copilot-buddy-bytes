import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Layers, TrendingUp, Activity, CheckCircle2, AlertCircle, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DataLakeService } from "@/services/dataLakeService";

const DataLakeDashboard = () => {
  // Fetch stats for each layer
  const { data: bronzeStats } = useQuery({
    queryKey: ['bronze-stats'],
    queryFn: () => DataLakeService.getBronzeStats()
  });

  const { data: silverStats } = useQuery({
    queryKey: ['silver-stats'],
    queryFn: () => DataLakeService.getSilverStats()
  });

  const { data: goldStats } = useQuery({
    queryKey: ['gold-stats'],
    queryFn: () => DataLakeService.getGoldStats()
  });

  const { data: productStats } = useQuery({
    queryKey: ['product-stats'],
    queryFn: () => DataLakeService.getProductStats()
  });

  const { data: pipelineStats } = useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: () => DataLakeService.getPipelineStats()
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Data Lake & Mesh</h1>
            <Badge variant="outline" className="ml-2">MS Fabric Architecture</Badge>
          </div>
          <p className="text-muted-foreground text-lg">
            Enterprise data platform with Bronze-Silver-Gold architecture
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bronze Layer</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bronzeStats?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Raw records ingested</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Silver Layer</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{silverStats?.validated.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                {silverStats?.avgQuality || 0}% avg quality
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gold Layer</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goldStats?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Business-ready metrics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Products</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productStats?.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                of {productStats?.total || 0} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link to="/data-lake/catalog">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Data Catalog</CardTitle>
                <CardDescription>
                  Search and discover data assets across all domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Browse Catalog</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/data-lake/products">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Layers className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Data Products</CardTitle>
                <CardDescription>
                  Manage domain-specific data products and ownership
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Manage Products</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/data-lake/lineage">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Data Lineage</CardTitle>
                <CardDescription>
                  Visualize data flow and transformation pipelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View Lineage</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/data-lake/quality">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Data Quality</CardTitle>
                <CardDescription>
                  Monitor quality scores and validation rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Quality Monitor</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/data-lake/analytics">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Activity className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Cross-Domain Analytics</CardTitle>
                <CardDescription>
                  Query and analyze data across multiple domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Run Analytics</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/data-lake/governance">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <AlertCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Data Governance</CardTitle>
                <CardDescription>
                  View policies, classifications, and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Governance Hub</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/ai-insights">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI Insights Hub</CardTitle>
                <CardDescription>
                  Ask questions and get intelligent analysis of your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Ask AI</Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Pipeline Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Pipeline Activity</CardTitle>
            <CardDescription>ETL pipeline execution summary (last 100 runs)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {pipelineStats?.completed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Failed</span>
                </div>
                <span className="text-2xl font-bold text-destructive">
                  {pipelineStats?.failed || 0}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-lg font-bold">
                    {pipelineStats?.total
                      ? Math.round((pipelineStats.completed / pipelineStats.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain Distribution */}
        {productStats && Object.keys(productStats.byDomain).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Data Products by Domain</CardTitle>
              <CardDescription>Distribution of active data products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(productStats.byDomain).map(([domain, count]) => (
                  <div key={domain} className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{domain}</Badge>
                    <span className="text-sm font-medium">{count} products</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default DataLakeDashboard;