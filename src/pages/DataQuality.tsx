import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DataQuality = () => {
  const { data: qualityMetrics, isLoading } = useQuery({
    queryKey: ['quality-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_quality_metrics')
        .select(`
          *,
          rule:data_quality_rules(rule_name, rule_type, severity),
          product:data_products(product_name, domain)
        `)
        .order('check_timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    }
  });

  const { data: qualityRules } = useQuery({
    queryKey: ['quality-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_quality_rules')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const avgQualityScore = qualityMetrics && qualityMetrics.length > 0
    ? Math.round(qualityMetrics.reduce((sum: number, m: any) => sum + (m.quality_score || 0), 0) / qualityMetrics.length)
    : 0;

  const passRate = qualityMetrics && qualityMetrics.length > 0
    ? Math.round((qualityMetrics.filter((m: any) => m.pass_rate >= 80).length / qualityMetrics.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Data Quality Monitor</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Real-time monitoring of data quality scores and validation rules
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getQualityColor(avgQualityScore)}`}>
                {avgQualityScore}%
              </div>
              <Progress value={avgQualityScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getQualityColor(passRate)}`}>
                {passRate}%
              </div>
              <Progress value={passRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{qualityRules?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Validation rules enforced
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quality Rules */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Quality Rules</CardTitle>
                <CardDescription>Rules enforcing data standards and compliance</CardDescription>
              </div>
              <Button>Create New Rule</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qualityRules && qualityRules.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No quality rules defined yet
                </p>
              )}

              {qualityRules && qualityRules.map((rule: any) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rule.rule_name}</h4>
                      <Badge variant="outline" className="capitalize">{rule.rule_type}</Badge>
                      <Badge className={`${getSeverityColor(rule.severity)} text-white`}>
                        {rule.severity}
                      </Badge>
                    </div>
                    {rule.target_table && (
                      <p className="text-sm text-muted-foreground">
                        Target: {rule.target_table}
                        {rule.target_column && ` → ${rule.target_column}`}
                      </p>
                    )}
                    {rule.threshold && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Threshold: {rule.threshold}%
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Quality Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quality Checks</CardTitle>
            <CardDescription>Latest data validation results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading && (
                <p className="text-center text-muted-foreground py-4">
                  Loading quality checks...
                </p>
              )}

              {!isLoading && qualityMetrics && qualityMetrics.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No quality checks performed yet
                </p>
              )}

              {qualityMetrics && qualityMetrics.map((metric: any) => (
                <div key={metric.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {metric.rule?.rule_name && (
                          <h4 className="font-semibold">{metric.rule.rule_name}</h4>
                        )}
                        {metric.rule?.rule_type && (
                          <Badge variant="outline" className="capitalize">
                            {metric.rule.rule_type}
                          </Badge>
                        )}
                      </div>
                      {metric.product?.product_name && (
                        <p className="text-sm text-muted-foreground">
                          Product: {metric.product.product_name}
                          {metric.product.domain && ` (${metric.product.domain})`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getQualityColor(metric.quality_score || 0)}`}>
                        {metric.quality_score || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                    </div>
                  </div>

                  {/* Check Results */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{metric.records_passed || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Passed</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{metric.records_failed || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{metric.records_checked || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>

                  {/* Pass Rate Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Pass Rate</span>
                      <span className="text-xs font-medium">{metric.pass_rate || 0}%</span>
                    </div>
                    <Progress value={metric.pass_rate || 0} />
                  </div>

                  {/* Issues */}
                  {metric.issues_found && Object.keys(metric.issues_found).length > 0 && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-medium mb-2">Issues Found:</p>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(metric.issues_found, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Checked: {new Date(metric.check_timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DataQuality;