import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const domains = [
  { id: 'hr', label: 'HR', color: 'bg-blue-500' },
  { id: 'it', label: 'IT', color: 'bg-purple-500' },
  { id: 'finance', label: 'Finance', color: 'bg-green-500' },
  { id: 'sales', label: 'Sales', color: 'bg-orange-500' },
  { id: 'compliance', label: 'Compliance', color: 'bg-red-500' }
];

const CrossDomainAnalytics = () => {
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['hr', 'it']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

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

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analytics-engine', {
        body: {
          action: 'cross-domain-analytics',
          domains: selectedDomains
        }
      });

      if (error) throw error;

      setAnalysisResults(data.results);
      toast.success('Analysis completed successfully');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to run analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
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
                    <div className={`w-3 h-3 rounded-full ${domain.color}`}></div>
                    <span className="font-medium">{domain.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={runAnalysis} 
              disabled={isAnalyzing || selectedDomains.length === 0}
              className="w-full mt-6"
            >
              {isAnalyzing ? 'Analyzing...' : `Analyze ${selectedDomains.length} Domain${selectedDomains.length !== 1 ? 's' : ''}`}
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
                          <Badge className={`${domains.find(d => d.id === domain)?.color || 'bg-gray-500'} text-white capitalize`}>
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
                          {Object.values(analysisResults).reduce((sum: number, d: any) => sum + (d.recordCount || 0), 0)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-base">Average Quality Across Domains</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-bold ${getQualityColor(
                          Math.round(Object.values(analysisResults).reduce((sum: number, d: any) => sum + (d.avgQualityScore || 0), 0) / Object.values(analysisResults).length)
                        )}`}>
                          {Math.round(Object.values(analysisResults).reduce((sum: number, d: any) => sum + (d.avgQualityScore || 0), 0) / Object.values(analysisResults).length)}%
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

      </div>
    </div>
  );
};

const getQualityColor = (score: number) => {
  if (score >= 90) return 'text-green-500';
  if (score >= 75) return 'text-yellow-500';
  return 'text-red-500';
};

export default CrossDomainAnalytics;