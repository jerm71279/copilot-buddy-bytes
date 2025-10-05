import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Download, Calendar, Shield } from "lucide-react";

export default function ComplianceReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: "Error",
        description: "Failed to load report details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      in_review: "outline",
      approved: "default",
      published: "default"
    };
    return colors[status] || "secondary";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Report not found</p>
          <Button onClick={() => navigate('/compliance')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Compliance Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate('/compliance')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Compliance Portal
        </Button>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{report.report_name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>{report.framework}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(report.generated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(report.status)}>
                {report.status}
              </Badge>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Overview</CardTitle>
              <CardDescription>
                Report period: {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Evidence Files</p>
                  <p className="text-2xl font-bold">{report.evidence_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Framework</p>
                  <p className="text-lg font-semibold">{report.framework}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Generated</p>
                  <p className="text-lg font-semibold">{new Date(report.generated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {report.findings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">
                  {JSON.stringify(report.findings, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
