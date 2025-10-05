import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import DashboardNavigation from "@/components/DashboardNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, FileCheck, AlertTriangle, TrendingUp, Plus } from "lucide-react";

interface Framework {
  id: string;
  framework_name: string;
  framework_code: string;
  description: string | null;
  industry: string;
}

interface EvidenceFile {
  id: string;
  file_name: string;
  framework_id: string | null;
  control_id: string | null;
  uploaded_at: string;
}

interface ComplianceReport {
  id: string;
  report_name: string;
  framework: string;
  status: string;
  generated_at: string;
  evidence_count: number;
}

export default function CompliancePortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    frameworks: 0,
    evidenceFiles: 0,
    reports: 0,
    complianceScore: 0
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    await loadComplianceData();
  };

  const loadComplianceData = async () => {
    try {
      const [frameworksRes, evidenceRes, reportsRes] = await Promise.all([
        supabase.from('compliance_frameworks').select('*').eq('is_active', true),
        supabase.from('evidence_files').select('*'),
        supabase.from('compliance_reports').select('*').order('generated_at', { ascending: false }).limit(10)
      ]);

      if (frameworksRes.error) throw frameworksRes.error;
      if (evidenceRes.error) throw evidenceRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setFrameworks(frameworksRes.data || []);
      setEvidenceFiles(evidenceRes.data || []);
      setReports(reportsRes.data || []);

      setStats({
        frameworks: frameworksRes.data?.length || 0,
        evidenceFiles: evidenceRes.data?.length || 0,
        reports: reportsRes.data?.length || 0,
        complianceScore: 85 // Calculate based on controls/evidence
      });
    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "secondary",
      in_review: "default",
      approved: "default",
      published: "default"
    };
    return colors[status] || "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <DashboardNavigation 
          title="Compliance Management"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics" },
            { name: "Compliance Portal", path: "/compliance" },
            { name: "Executive Dashboard", path: "/dashboard/executive" },
            { name: "Finance Dashboard", path: "/dashboard/finance" },
            { name: "HR Dashboard", path: "/dashboard/hr" },
            { name: "IT Dashboard", path: "/dashboard/it" },
            { name: "Operations Dashboard", path: "/dashboard/operations" },
            { name: "Sales Dashboard", path: "/dashboard/sales" },
            { name: "SOC Dashboard", path: "/dashboard/soc" },
          ]}
        />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Compliance Management</h1>
            <p className="text-muted-foreground">Track compliance frameworks and evidence collection</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/compliance/audit-reports')}>
              <FileCheck className="mr-2 h-4 w-4" />
              Generate Audit Report
            </Button>
            <Button onClick={() => navigate('/compliance/evidence/upload')} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Upload Evidence
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Active Frameworks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.frameworks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Evidence Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evidenceFiles}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.complianceScore}%</div>
              <Progress value={stats.complianceScore} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reports}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="frameworks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="frameworks" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  Loading frameworks...
                </CardContent>
              </Card>
            ) : frameworks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No frameworks configured</h3>
                  <p className="text-muted-foreground">Contact support to enable compliance frameworks</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frameworks.map((framework) => (
                  <Card 
                    key={framework.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/compliance/frameworks/${framework.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{framework.framework_name}</CardTitle>
                      <CardDescription>
                        {framework.framework_code} • {framework.industry}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {framework.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            {evidenceFiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No evidence files uploaded</h3>
                  <p className="text-muted-foreground mb-4">Upload compliance evidence to get started</p>
                  <Button onClick={() => navigate('/compliance/evidence/upload')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Evidence
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {evidenceFiles.slice(0, 10).map((file) => (
                  <Card key={file.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No compliance reports</h3>
                  <p className="text-muted-foreground">Generate your first compliance report</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <Card 
                    key={report.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/compliance/reports/${report.id}`)}
                  >
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{report.report_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.framework} • {new Date(report.generated_at).toLocaleDateString()} • {report.evidence_count} evidence files
                          </p>
                        </div>
                        <Badge variant={getStatusColor(report.status) as any}>
                          {report.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
