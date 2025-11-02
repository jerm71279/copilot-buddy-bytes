import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useEdgeFunction } from "@/hooks/useEdgeFunction";

const domains = [
  { id: 'hr', label: 'HR', variant: 'default' as const },
  { id: 'it', label: 'IT', variant: 'secondary' as const },
  { id: 'finance', label: 'Finance', variant: 'default' as const },
  { id: 'sales', label: 'Sales', variant: 'outline' as const },
  { id: 'compliance', label: 'Compliance', variant: 'destructive' as const }
];

const CrossDomainAnalytics = () => {
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['hr', 'it']);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const analyticsEngine = useEdgeFunction('analytics-engine');

  const toggleDomain = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(d => d !== domainId)
        : [...prev, domainId]
    );
  };

  const runAnalysis = async () => {
    if (selectedDomains.length === 0) {
      toast.error('Please select at least one domain');
      return;
    }

    try {
      const data = await analyticsEngine.execute({
        action: 'cross-domain-analytics',
        domains: selectedDomains
      });

      if (data?.results) {
        setAnalysisResults(data.results);
        toast.success('Analysis completed successfully');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to run analysis');
    }
  };

  return (
    <DashboardLayout>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Cross-Domain Analytics</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Query and analyze data across multiple business domains simultaneously
          </p>
        </div>

        {/* Domain Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Domains to Analyze</CardTitle>
            <CardDescription>
              Choose which domains to include in the cross-domain analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {domains.map(domain => (
                <div key={domain.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                     onClick={() => toggleDomain(domain.id)}>
                  <Checkbox
                    checked={selectedDomains.includes(domain.id)}
                    onCheckedChange={() => toggleDomain(domain.id)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="font-medium">{domain.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={runAnalysis} 
              disabled={analyticsEngine.loading || selectedDomains.length === 0}
              className="w-full mt-6"
            >
              {analyticsEngine.loading ? 'Analyzing...' : `Analyze ${selectedDomains.length} Domain${selectedDomains.length !== 1 ? 's' : ''}`}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisResults && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  Cross-domain insights from {Object.keys(analysisResults).length} domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(analysisResults).map(([domain, domainData]: [string, any]) => {
                    const data = domainData as any;
                    return (
                    <Card key={domain} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant={domains.find(d => d.id === domain)?.variant || 'default'} className="capitalize">
                            {domain}
                          </Badge>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Records</span>
                            <span className="text-lg font-bold">{domainData.recordCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Quality</span>
                            <span className={`text-lg font-bold ${getQualityColor(domainData.avgQualityScore)}`}>
                              {domainData.avgQualityScore}%
                            </span>
                          </div>
                          {domainData.latestUpdate && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Latest: {new Date(domainData.latestUpdate).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )})}
                </div>

                {/* Unified Insights */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Unified Insights</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-base">Total Records Analyzed</CardTitle>
                      </CardHeader>
                      <CardContent>
                      <div className="text-3xl font-bold">
                          {(Object.values(analysisResults) as any[]).reduce((sum: number, d: any) => sum + (d.recordCount || 0), 0)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-base">Average Quality Across Domains</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-bold ${getQualityColor(
                          Math.round((Object.values(analysisResults) as any[]).reduce((sum: number, d: any) => sum + (d.avgQualityScore || 0), 0) / (Object.values(analysisResults) as any[]).length)
                        )}`}>
                          {Math.round((Object.values(analysisResults) as any[]).reduce((sum: number, d: any) => sum + (d.avgQualityScore || 0), 0) / (Object.values(analysisResults) as any[]).length)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Results State */}
        {!analysisResults && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select domains above and click "Analyze" to run cross-domain analytics and discover unified insights
              </p>
            </CardContent>
          </Card>
        )}

    </DashboardLayout>
  );
};

const getQualityColor = (score: number) => {
  if (score >= 90) return 'text-primary';
  if (score >= 75) return 'text-secondary';
  return 'text-destructive';
};

export default CrossDomainAnalytics;