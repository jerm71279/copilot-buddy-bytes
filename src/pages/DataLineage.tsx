import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, ArrowRight, Database, Filter as FilterIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DataLineage = () => {
  const [selectedLayer, setSelectedLayer] = useState<string>("all");

  const { data: lineageData, isLoading } = useQuery({
    queryKey: ['data-lineage', selectedLayer],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_lineage')
        .select(`
          *,
          pipeline_run:etl_pipeline_runs(pipeline_name, status, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    }
  });

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'raw': return 'bg-secondary';
      case 'silver': return 'bg-accent';
      case 'gold': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const getTransformationIcon = (type: string) => {
    switch (type) {
      case 'transform': return <ArrowRight className="h-4 w-4" />;
      case 'filter': return <FilterIcon className="h-4 w-4" />;
      case 'aggregate': return <Database className="h-4 w-4" />;
      default: return <GitBranch className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Data Lineage</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Visualize data transformations and dependencies across layers
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Select value={selectedLayer} onValueChange={setSelectedLayer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Layer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Layers</SelectItem>
                  <SelectItem value="bronze">Bronze → Silver</SelectItem>
                  <SelectItem value="silver">Silver → Gold</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Export Lineage</Button>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Layer Legend</CardTitle>
            <CardDescription>Understanding the data transformation layers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-secondary"></div>
                <span className="text-sm">Bronze (Raw)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-accent"></div>
                <span className="text-sm">Silver (Transformed)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary"></div>
                <span className="text-sm">Gold (Analytics)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lineage Flow */}
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading lineage data...
            </div>
          )}

          {!isLoading && lineageData && lineageData.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Lineage Data Available</h3>
                <p className="text-muted-foreground">
                  Start ingesting and transforming data to see lineage flows
                </p>
              </CardContent>
            </Card>
          )}

          {lineageData && lineageData.map((lineage: any) => (
            <Card key={lineage.id} className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Source */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getEntityColor(lineage.source_entity_type)}>
                        <span className="text-primary-foreground">{lineage.source_entity_type}</span>
                      </Badge>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-mono truncate">
                      {lineage.source_entity_id}
                    </p>
                  </div>

                  {/* Transformation */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md">
                      {getTransformationIcon(lineage.transformation_type)}
                      <span className="text-sm font-medium capitalize">
                        {lineage.transformation_type || 'transform'}
                      </span>
                    </div>
                    {lineage.transformation_logic && (
                      <p className="text-xs text-muted-foreground max-w-xs truncate">
                        {lineage.transformation_logic}
                      </p>
                    )}
                  </div>

                  {/* Target */}
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <Badge className={getEntityColor(lineage.target_entity_type)}>
                        <span className="text-primary-foreground">{lineage.target_entity_type}</span>
                      </Badge>
                    </div>
                    <p className="text-sm font-mono truncate">
                      {lineage.target_entity_id}
                    </p>
                  </div>
                </div>

                {/* Pipeline Info */}
                {lineage.pipeline_run && (
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Pipeline: {lineage.pipeline_run.pipeline_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={lineage.pipeline_run.status === 'completed' ? 'default' : 'destructive'}>
                        {lineage.pipeline_run.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(lineage.pipeline_run.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-2 text-xs text-muted-foreground">
                  Tracked: {new Date(lineage.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Visual Graph Placeholder */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Interactive Lineage Graph</CardTitle>
            <CardDescription>
              Visual representation of data flows (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Interactive graph visualization will appear here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DataLineage;