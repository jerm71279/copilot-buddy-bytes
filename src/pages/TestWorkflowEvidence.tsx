import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, CheckCircle, AlertCircle, LayoutDashboard, FileText, Database } from "lucide-react";
import { LinkTray } from "@/components/LinkTray";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useStandardToast } from "@/hooks/useStandardToast";

export default function TestWorkflowEvidence() {
  const showToast = useStandardToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateEvidence = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      console.log('Calling batch-evidence-generator...');
      
      const { data, error } = await supabase.functions.invoke('batch-evidence-generator', {
        body: {}
      });

      if (error) {
        console.error('Error calling function:', error);
        throw error;
      }

      console.log('Function response:', data);
      setResult(data);

      showToast.success(`Generated evidence for ${data.evidence_generated} workflows`);
    } catch (error) {
      console.error('Error generating evidence:', error);
      showToast.error("Error", { 
        description: error instanceof Error ? error.message : "Failed to generate evidence" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout showDashboardNavigation={false}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Test Workflow Evidence Generation</h1>

        <LinkTray
          items={[
            { label: "DevOps Portal", path: "/devops", icon: LayoutDashboard },
            { label: "Compliance Portal", path: "/compliance", icon: FileText },
            { label: "CMDB", path: "/cmdb", icon: Database },
          ]}
          maxVisibleItems={3}
        />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Batch Evidence Generator
            </CardTitle>
            <CardDescription>
              Generate evidence files for all completed workflow executions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={generateEvidence} 
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? "Generating..." : "Generate Evidence for All Workflows"}
            </Button>

            {result && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  {result.errors > 0 ? (
                    <AlertCircle className="h-5 w-5 text-warning" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                  <h3 className="font-semibold">Results</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Executions</p>
                    <p className="text-2xl font-bold">{result.total_executions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Evidence Generated</p>
                    <p className="text-2xl font-bold text-success">{result.evidence_generated}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Errors</p>
                    <p className="text-2xl font-bold text-warning">{result.errors}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
