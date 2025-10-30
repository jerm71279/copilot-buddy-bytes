import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useComplianceFunctions } from "@/hooks/useComplianceFunctions";
import {
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download,
  Clock,
  Users,
  Database,
  Lock,
  Activity,
  FileCheck,
  ChevronRight,
  Play
} from "lucide-react";
import { DashboardSettingsMenu } from "@/components/DashboardSettingsMenu";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ControlStatus {
  id: string;
  category: string;
  control_id: string;
  control_name: string;
  description: string;
  automation_level: string;
  framework_id: string;
  required_evidence: string[];
}

const CMMC_DOMAINS = [
  { id: 'AC', name: 'Access Control', controls: 9, icon: Lock },
  { id: 'AU', name: 'Audit & Accountability', controls: 4, icon: FileCheck },
  { id: 'AT', name: 'Awareness & Training', controls: 2, icon: Users },
  { id: 'CM', name: 'Configuration Management', controls: 4, icon: Database },
  { id: 'IA', name: 'Identification & Authentication', controls: 3, icon: Shield },
  { id: 'IR', name: 'Incident Response', controls: 3, icon: AlertTriangle },
  { id: 'MA', name: 'Maintenance', controls: 2, icon: Activity },
  { id: 'MP', name: 'Media Protection', controls: 3, icon: Lock },
  { id: 'PS', name: 'Personnel Security', controls: 1, icon: Users },
  { id: 'PE', name: 'Physical Protection', controls: 2, icon: Shield },
  { id: 'RE', name: 'Recovery', controls: 1, icon: Activity },
  { id: 'RM', name: 'Risk Management', controls: 1, icon: AlertTriangle },
  { id: 'CA', name: 'Security Assessment', controls: 4, icon: FileCheck },
  { id: 'SC', name: 'System & Communications', controls: 3, icon: Activity },
  { id: 'SI', name: 'System & Information Integrity', controls: 3, icon: Shield },
];

const CMMCReadiness = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [controls, setControls] = useState<ControlStatus[]>([]);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [readinessScore, setReadinessScore] = useState(0);

  useEffect(() => {
    loadReadinessData();
  }, []);

  const loadReadinessData = async () => {
    try {
      // Load evidence files
      const { data: evidence, error: evidenceError } = await supabase
        .from('evidence_files')
        .select('*')
        .contains('compliance_tags', ['CMMC']);

      if (evidenceError) throw evidenceError;
      setEvidenceCount(evidence?.length || 0);

      // Load control mappings
      const { data: controlsData, error: controlsError } = await supabase
        .from('compliance_controls')
        .select('*')
        .eq('framework_id', 'cmmc_level_2')
        .order('control_number');

      if (controlsError) throw controlsError;

      // Calculate readiness score based on evidence coverage
      const controlsWithEvidence = controlsData?.filter(c => {
        const hasEvidence = evidence?.some(e => 
          e.compliance_tags?.includes(c.control_id)
        );
        return hasEvidence;
      }).length || 0;
      const total = 43;
      setReadinessScore(Math.round((controlsWithEvidence / total) * 100));

      setControls(controlsData || []);
    } catch (error) {
      console.error('Error loading readiness data:', error);
      toast.error('Failed to load CMMC readiness data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateEvidencePackage = async () => {
    await batchEvidenceGenerator.invoke({
      controlIds: controls.map(c => c.id),
      customerId: customerId || undefined
    });
  };

  const runPreAssessment = async () => {
    await intelligentAssistant.invoke({
      query: `Conduct a comprehensive CMMC Level 2 readiness assessment. Analyze all 43 controls across 15 domains. Identify gaps, missing evidence, and provide actionable recommendations for C3PAO audit preparation.`,
      context: JSON.stringify({
        controls: controls,
        evidence_count: evidenceCount,
        current_score: readinessScore
      })
    });
  };

  const getDomainProgress = (domainId: string) => {
    const domainControls = controls.filter(c => c.control_id?.startsWith(domainId));
    return domainControls.length > 0 ? Math.round((domainControls.length / CMMC_DOMAINS.find(d => d.id === domainId)?.controls || 1) * 100) : 0;
  };

  const getAutomationColor = (level: string) => {
    switch (level) {
      case 'full': return 'text-primary bg-primary/10';
      case 'partial': return 'text-warning bg-warning/10';
      case 'manual': return 'text-secondary bg-secondary/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading CMMC readiness data...</div>;
  }

  const implementedCount = controls.filter(c => c.automation_level === 'full').length;
  const partialCount = controls.filter(c => c.automation_level === 'partial').length;
  const notStartedCount = controls.filter(c => c.automation_level === 'manual').length;

  return (
    <DashboardLayout className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-destructive" />
              CMMC Level 2 Readiness
            </h1>
            <p className="text-muted-foreground mt-1">DoD Cybersecurity Maturity Model Certification</p>
          </div>
          <DashboardSettingsMenu dashboardName="CMMC Readiness" />
        </div>

        {/* Readiness Score Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Readiness</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{readinessScore}%</div>
              <Progress value={readinessScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {implementedCount} of 43 controls implemented
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evidence Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{evidenceCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Automated evidence collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Control Domains</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{CMMC_DOMAINS.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                15 security domains covered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audit Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {readinessScore >= 95 ? 'Ready' : 'In Progress'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                C3PAO audit preparation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>C3PAO Audit Preparation</CardTitle>
            <CardDescription>Automated tools for CMMC certification readiness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Button 
                onClick={generateEvidencePackage}
                className="w-full justify-start"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Evidence Package
              </Button>
              <Button 
                onClick={runPreAssessment}
                className="w-full justify-start"
                variant="outline"
              >
                <Play className="h-4 w-4 mr-2" />
                Run Pre-Assessment
              </Button>
              <Button 
                onClick={() => navigate('/compliance/evidence-upload')}
                className="w-full justify-start"
                variant="outline"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Upload Additional Evidence
              </Button>
            </div>
            
            {readinessScore >= 95 && (
              <div className="bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[hsl(var(--success))]">Ready for C3PAO Audit</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your organization has achieved 95%+ compliance. You can now schedule a C3PAO assessment
                      and submit your certification application to CMMC-AB.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="domains">Domain Overview</TabsTrigger>
            <TabsTrigger value="controls">Control Details</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CMMC Domain Coverage</CardTitle>
                <CardDescription>Progress across all 15 security domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {CMMC_DOMAINS.map((domain) => {
                    const progress = getDomainProgress(domain.id);
                    const Icon = domain.icon;
                    return (
                      <Card key={domain.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <CardTitle className="text-sm">{domain.name}</CardTitle>
                            </div>
                            <Badge variant="outline">{domain.controls}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{domain.id}</span>
                              <span className="font-semibold">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controls">
            <Card>
              <CardHeader>
                <CardTitle>Control Implementation Status</CardTitle>
                <CardDescription>Detailed view of all 43 CMMC Level 2 controls</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Control ID</TableHead>
                      <TableHead>Control Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Automation</TableHead>
                      <TableHead>Evidence Required</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {controls.map((control) => (
                      <TableRow 
                        key={control.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/compliance/control/${control.id}`)}
                      >
                        <TableCell className="font-mono text-sm">{control.control_id}</TableCell>
                        <TableCell className="font-medium">{control.control_name}</TableCell>
                        <TableCell>{control.category}</TableCell>
                        <TableCell>
                          <Badge className={getAutomationColor(control.automation_level)}>
                            {control.automation_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {control.required_evidence?.length || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gaps">
            <Card>
              <CardHeader>
                <CardTitle>Gap Analysis & Recommendations</CardTitle>
                <CardDescription>Areas requiring attention before C3PAO audit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notStartedCount > 0 && (
                  <div className="bg-destructive/10 border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-destructive">Critical: {notStartedCount} Controls Not Started</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          These controls require immediate attention for certification readiness.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-3"
                          onClick={() => navigate('/compliance')}
                        >
                          View Not Started Controls
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {partialCount > 0 && (
                  <div className="bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-[hsl(var(--warning))] mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-[hsl(var(--warning))]">Warning: {partialCount} Partially Implemented</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Complete implementation and gather additional evidence for these controls.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {evidenceCount < 43 && (
                  <div className="bg-[hsl(var(--blue))]/10 border-[hsl(var(--blue))]/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-[hsl(var(--blue))] mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-[hsl(var(--blue))]">Evidence Gap: {43 - evidenceCount} Controls Missing Documentation</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Each control requires at least one evidence file for C3PAO audit.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-3"
                          onClick={generateEvidencePackage}
                        >
                          Auto-Generate Missing Evidence
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {readinessScore >= 95 && evidenceCount >= 43 && (
                  <div className="bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-[hsl(var(--success))]">Excellent: Ready for Certification</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          All critical gaps addressed. Proceed with C3PAO scheduling.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DepartmentAIAssistant department="compliance" departmentLabel="CMMC Compliance" />

    </DashboardLayout>
  );
};

export default CMMCReadiness;
