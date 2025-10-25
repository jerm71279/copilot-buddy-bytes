import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertCircle, CheckCircle2, FileText, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DataGovernance = () => {
  const { data: catalogStats } = useQuery({
    queryKey: ['governance-catalog'],
    queryFn: async () => {
      const { data } = await supabase
        .from('data_catalog')
        .select('data_classification, contains_pii');
      
      const byClassification = data?.reduce((acc: Record<string, number>, entry) => {
        if (entry.data_classification) {
          acc[entry.data_classification] = (acc[entry.data_classification] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      const piiCount = data?.filter(e => e.contains_pii).length || 0;

      return { byClassification, piiCount, total: data?.length || 0 };
    }
  });

  const { data: qualityCompliance } = useQuery({
    queryKey: ['governance-quality'],
    queryFn: async () => {
      const { data } = await supabase
        .from('data_quality_metrics')
        .select('quality_score, pass_rate')
        .order('check_timestamp', { ascending: false })
        .limit(100);

      const avgQuality = data && data.length > 0
        ? Math.round(data.reduce((sum, m) => sum + (m.quality_score || 0), 0) / data.length)
        : 0;

      const compliant = data?.filter(m => (m.pass_rate || 0) >= 80).length || 0;
      const total = data?.length || 0;

      return { avgQuality, compliant, total, complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0 };
    }
  });

  const { data: pipelineHealth } = useQuery({
    queryKey: ['governance-pipelines'],
    queryFn: async () => {
      const { data } = await supabase
        .from('etl_pipeline_runs')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(50);

      const completed = data?.filter(p => p.status === 'completed').length || 0;
      const total = data?.length || 0;

      return {
        healthScore: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed,
        total
      };
    }
  });

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'bg-green-500';
      case 'internal': return 'bg-blue-500';
      case 'confidential': return 'bg-orange-500';
      case 'restricted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Data Governance</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Monitor data policies, classifications, and compliance standards
          </p>
        </div>

        {/* Governance Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityCompliance?.avgQuality || 0}%</div>
              <p className="text-xs text-muted-foreground">Average quality score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityCompliance?.complianceRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {qualityCompliance?.compliant || 0} of {qualityCompliance?.total || 0} checks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PII Assets</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{catalogStats?.piiCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                of {catalogStats?.total || 0} total assets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pipelineHealth?.healthScore || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {pipelineHealth?.completed || 0} successful runs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Classification Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Data Classification Distribution</CardTitle>
            <CardDescription>
              How data assets are classified by sensitivity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {catalogStats && Object.entries(catalogStats.byClassification || {}).map(([classification, count]: [string, any]) => (
                <div key={classification} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getClassificationColor(classification)} text-white capitalize`}>
                      {classification}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {classification === 'public' && 'Publicly accessible data'}
                      {classification === 'internal' && 'Internal use only'}
                      {classification === 'confidential' && 'Restricted access required'}
                      {classification === 'restricted' && 'Highest security protocols'}
                    </span>
                  </div>
                  <span className="text-lg font-bold">{count} assets</span>
                </div>
              ))}

              {catalogStats && Object.keys(catalogStats.byClassification || {}).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No classified data assets yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Governance Policies */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <Lock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Access Policies</CardTitle>
              <CardDescription>
                Control who can access different data assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Private Assets</span>
                  <Badge variant="outline">Owner Only</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Department Assets</span>
                  <Badge variant="outline">Department Members</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Organization Assets</span>
                  <Badge variant="outline">All Employees</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Public Assets</span>
                  <Badge variant="outline">Everyone</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Manage Policies
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Retention Policies</CardTitle>
              <CardDescription>
                Data lifecycle and retention requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Short-term (30 days)</span>
                  <Badge variant="secondary">Bronze Layer</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Medium-term (90 days)</span>
                  <Badge variant="secondary">Silver Layer</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Long-term (7 years)</span>
                  <Badge variant="secondary">Gold Layer</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Compliance Archive (Indefinite)</span>
                  <Badge variant="secondary">Compliance Domain</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Configure Retention
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>
              Governance compliance across all data domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-semibold">Data Classification</p>
                    <p className="text-sm text-muted-foreground">All assets properly classified</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Compliant</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-semibold">PII Tracking</p>
                    <p className="text-sm text-muted-foreground">PII assets identified and protected</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Compliant</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-semibold">Access Control</p>
                    <p className="text-sm text-muted-foreground">RLS policies enforced on all tables</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">Compliant</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-semibold">Retention Policies</p>
                    <p className="text-sm text-muted-foreground">Some policies need review</p>
                  </div>
                </div>
                <Badge className="bg-yellow-500 text-white">Review Required</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DataGovernance;