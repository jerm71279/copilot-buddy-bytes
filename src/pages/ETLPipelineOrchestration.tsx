import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RefreshCw, Settings, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStandardToast } from "@/hooks/useStandardToast";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const ETLPipelineOrchestration = () => {
  const toast = useStandardToast();
  const queryClient = useQueryClient();

  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['etl-pipelines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etl_pipeline_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const triggerPipeline = useMutation({
    mutationFn: async (pipelineName: string) => {
      const { data, error } = await supabase.functions.invoke('etl-orchestration', {
        body: { action: 'trigger', pipeline: pipelineName }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etl-pipelines'] });
      toast.success("ETL pipeline started successfully");
    }
  });

  const pipelineTemplates = [
    { 
      name: 'Bronze Ingestion', 
      description: 'Ingest raw data from sources',
      schedule: 'Every 5 minutes',
      status: 'active'
    },
    { 
      name: 'Silver Transformation', 
      description: 'Clean and validate data',
      schedule: 'Every 15 minutes',
      status: 'active'
    },
    { 
      name: 'Gold Aggregation', 
      description: 'Create business metrics',
      schedule: 'Every hour',
      status: 'active'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">ETL Pipeline Orchestration</h1>
              <p className="text-muted-foreground text-lg">Automated data transformation workflows</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {pipelineTemplates.map((template) => (
            <Card key={template.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="outline">{template.status}</Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{template.schedule}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => triggerPipeline.mutate(template.name)}
                    disabled={triggerPipeline.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Pipeline Runs</CardTitle>
            <CardDescription>Execution history and status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Loading pipeline runs...</div>
            ) : (
              <div className="space-y-4">
                {pipelines?.map((run: any) => (
                  <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {run.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : run.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-secondary animate-spin" />
                      )}
                      <div>
                        <p className="font-medium">{run.pipeline_name || 'ETL Pipeline'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(run.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      run.status === 'completed' ? 'default' : 
                      run.status === 'failed' ? 'destructive' : 
                      'secondary'
                    }>
                      {run.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ETLPipelineOrchestration;
