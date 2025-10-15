import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import DashboardNavigation from '@/components/DashboardNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2,
  XCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Play,
  Zap,
  Database,
  Shield,
  Activity,
  GitBranch,
  ArrowRight,
  Bug,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardSettingsMenu } from '@/components/DashboardSettingsMenu';
import { DepartmentAIAssistant } from '@/components/DepartmentAIAssistant';
import MCPServerStatus from '@/components/MCPServerStatus';

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'passed' | 'failed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  route?: string;
}

interface TestPhase {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
}

export default function ComprehensiveTestDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFuzzing, setIsFuzzing] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [testDataResult, setTestDataResult] = useState<any>(null);
  const [fuzzResult, setFuzzResult] = useState<any>(null);
  const [flowTrace, setFlowTrace] = useState<any>(null);
  const [testUser, setTestUser] = useState<any>(null);
  const [isManagingUser, setIsManagingUser] = useState(false);
  
  const [testPhases] = useState<TestPhase[]>([
    {
      id: 'feedback-loop',
      name: 'Feedback Loop',
      description: 'Test all 4 phases',
      tests: [
        { id: 'phase1', name: 'AI Assistant', description: 'Test AI responses', status: 'not-started', priority: 'critical', route: '/intelligent-assistant' },
        { id: 'phase2', name: 'Insights', description: 'View insights', status: 'not-started', priority: 'critical', route: '/department-insights' },
        { id: 'phase3', name: 'MML Engine', description: 'Global insights', status: 'not-started', priority: 'critical', route: '/global-insights' },
        { id: 'phase4', name: 'Feedback', description: 'Distribute feedback', status: 'not-started', priority: 'critical', route: '/department-feedback' }
      ]
    }
  ]);

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />;
      case 'failed': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'blocked': return <AlertCircle className="h-5 w-5 text-[hsl(var(--warning))]" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-[hsl(var(--blue))]" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const generateTestData = async () => {
    setIsGenerating(true);
    setTestDataResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-test-data-generator', {});
      if (error) throw error;

      setTestDataResult(data);
      toast({
        title: "Success",
        description: `Generated ${data.summary.total_records_created} test records`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate test data",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const runFuzzTests = async () => {
    setIsFuzzing(true);
    setFuzzResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('input-fuzzer', {});
      if (error) throw error;

      setFuzzResult(data);
      toast({
        title: data.summary.vulnerabilities_found === 0 ? "All Tests Passed" : "Vulnerabilities Found",
        description: `${data.summary.passed}/${data.summary.total_tests} tests passed`,
        variant: data.summary.vulnerabilities_found > 0 ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run fuzz tests",
        variant: "destructive"
      });
    } finally {
      setIsFuzzing(false);
    }
  };

  const traceFlow = async (flowType: string) => {
    setIsTracing(true);
    setFlowTrace(null);

    try {
      const { data, error } = await supabase.functions.invoke('database-flow-logger', {
        body: { action: `trace_${flowType}` }
      });
      if (error) throw error;

      setFlowTrace(data);
      toast({
        title: "Flow Traced",
        description: `Traced ${data.summary.total_operations} operations`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trace flow",
        variant: "destructive"
      });
    } finally {
      setIsTracing(false);
    }
  };

  const runAllTests = async () => {
    await generateTestData();
    await runFuzzTests();
  };

  const checkTestUser = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-test-user', {
        body: { action: 'get' }
      });
      if (error) throw error;
      if (data.success) {
        setTestUser(data);
      }
    } catch (error) {
      console.error('Error checking test user:', error);
    }
  };

  const createTestUser = async () => {
    setIsManagingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-user', {
        body: { action: 'create' }
      });
      if (error) throw error;
      setTestUser(data);
      toast({
        title: "Success",
        description: "Test user created: test.user@obera.app",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create test user",
        variant: "destructive"
      });
    } finally {
      setIsManagingUser(false);
    }
  };

  const deleteTestUser = async () => {
    setIsManagingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-user', {
        body: { action: 'delete' }
      });
      if (error) throw error;
      setTestUser(null);
      toast({
        title: "Success",
        description: "Test user deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete test user",
        variant: "destructive"
      });
    } finally {
      setIsManagingUser(false);
    }
  };

  useEffect(() => {
    checkTestUser();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-56 pb-8">
        <DashboardNavigation 
          title="Comprehensive Testing Dashboard"
          dashboards={[
            { name: "Admin Dashboard", path: "/admin" },
            { name: "Employee Portal", path: "/portal" },
            { name: "Analytics Portal", path: "/analytics" },
            { name: "Compliance Portal", path: "/compliance" },
            { name: "Change Management", path: "/change-management" },
            { name: "Executive Dashboard", path: "/dashboard/executive" },
            { name: "Finance Dashboard", path: "/dashboard/finance" },
            { name: "HR Dashboard", path: "/dashboard/hr" },
            { name: "IT Dashboard", path: "/dashboard/it" },
            { name: "Operations Dashboard", path: "/dashboard/operations" },
            { name: "Sales Dashboard", path: "/dashboard/sales" },
            { name: "SOC Dashboard", path: "/dashboard/soc" },
          ]}
        />
        
        <div className="mb-8 flex justify-between items-center">
          <p className="text-muted-foreground">
            Generate test data, run fuzz tests, and validate system security
          </p>
          <DashboardSettingsMenu dashboardName="Comprehensive Testing" />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="flows">Flow Tracing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Test User Setup
                </CardTitle>
                <CardDescription>
                  Create a dedicated test user for realistic test data validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testUser ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                    <AlertTitle>Test User Active</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-sm"><strong>Email:</strong> {testUser.email}</p>
                          <p className="text-sm"><strong>User ID:</strong> {testUser.user_id}</p>
                          <p className="text-sm text-muted-foreground">Password: TestUser123!</p>
                        </div>
                      </div>
                      <Button 
                        onClick={deleteTestUser} 
                        disabled={isManagingUser}
                        variant="destructive"
                        size="sm"
                      >
                        Delete Test User
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={createTestUser} 
                      disabled={isManagingUser}
                      variant="outline"
                    >
                      {isManagingUser ? "Creating..." : "Create Test User"}
                    </Button>
                    <Button 
                      onClick={checkTestUser} 
                      disabled={isManagingUser}
                      variant="ghost"
                      size="sm"
                    >
                      Check for Existing User
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button onClick={runAllTests} disabled={isGenerating || isFuzzing} size="lg" className="flex-1">
                  <Zap className="mr-2 h-4 w-4" />
                  {(isGenerating || isFuzzing) ? "Running..." : "Run All Tests"}
                </Button>
                <Button onClick={generateTestData} disabled={isGenerating} variant="outline" size="lg" className="flex-1">
                  <Database className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate Data"}
                </Button>
                <Button onClick={runFuzzTests} disabled={isFuzzing} variant="outline" size="lg" className="flex-1">
                  <Shield className="mr-2 h-4 w-4" />
                  {isFuzzing ? "Fuzzing..." : "Fuzz Tests"}
                </Button>
              </CardContent>
            </Card>

            <Alert className="border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/10">
              <Shield className="h-4 w-4 text-[hsl(var(--success))]" />
              <AlertTitle className="text-foreground">Input Validation System Active</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <p>Multi-layer protection against SQL injection, XSS, path traversal, and other attacks:</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                      <span className="text-sm">Client-side validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                      <span className="text-sm">Edge function validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Database triggers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Real-time sanitization</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-green-700 border-green-300"
                      onClick={() => window.open('/INPUT_VALIDATION_GUIDE.md', '_blank')}
                    >
                      <FileText className="h-3 w-3 mr-2" />
                      View Validation Guide
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Two-Tier Feedback Loop Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {testPhases[0].tests.map(test => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h4 className="font-semibold">{test.name}</h4>
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                      </div>
                    </div>
                    {test.route && (
                      <Button size="sm" onClick={() => navigate(test.route!)}>
                        <Play className="h-4 w-4 mr-2" />Test
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {testDataResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Data Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Components</p>
                      <p className="text-2xl font-bold">{testDataResult.summary.total_components}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Records</p>
                      <p className="text-2xl font-bold text-green-600">{testDataResult.summary.total_records_created}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Errors</p>
                      <p className="text-2xl font-bold text-red-600">{testDataResult.summary.total_errors}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-2xl font-bold">{testDataResult.summary.total_duration_ms}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {fuzzResult && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Security Fuzz Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Tests</p>
                        <p className="text-2xl font-bold">{fuzzResult.summary.total_tests}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Passed</p>
                        <p className="text-2xl font-bold text-green-600">{fuzzResult.summary.passed}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Failed</p>
                        <p className="text-2xl font-bold text-yellow-600">{fuzzResult.summary.failed}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Vulnerabilities</p>
                        <p className="text-2xl font-bold text-red-600">{fuzzResult.summary.vulnerabilities_found}</p>
                      </div>
                    </div>
                    <Progress value={(fuzzResult.summary.passed / fuzzResult.summary.total_tests) * 100} />
                  </CardContent>
                </Card>

                {fuzzResult.vulnerabilities && fuzzResult.vulnerabilities.length > 0 && (
                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Critical Vulnerabilities Detected
                      </CardTitle>
                      <CardDescription>
                        {fuzzResult.vulnerabilities.length} security vulnerabilities found that require immediate attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {fuzzResult.vulnerabilities.map((vuln: any, idx: number) => (
                        <Alert key={idx} variant="destructive">
                          <Bug className="h-4 w-4" />
                          <AlertTitle className="flex items-center justify-between">
                            <span>{vuln.test_type} Vulnerability in {vuln.table}.{vuln.field}</span>
                            <Badge variant="destructive">{vuln.test_type}</Badge>
                          </AlertTitle>
                          <AlertDescription className="space-y-3 mt-2">
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-sm">Test Value:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">
                                  {vuln.test_value}
                                </code>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Expected:</span>
                                <Badge variant="outline">{vuln.expected_result}</Badge>
                                <span className="font-semibold text-sm ml-4">Actual:</span>
                                <Badge variant="destructive">{vuln.actual_result}</Badge>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="bg-muted p-3 rounded-lg space-y-2">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Remediation Steps
                              </h4>
                              {vuln.test_type === 'SQL Injection' && (
                                <ul className="text-sm space-y-1 ml-6 list-disc">
                                  <li>Add input validation using parameterized queries</li>
                                  <li>Implement input sanitization for special characters</li>
                                  <li>Add database-level constraints on {vuln.field}</li>
                                  <li>Review RLS policies for {vuln.table}</li>
                                </ul>
                              )}
                              {vuln.test_type === 'XSS' && (
                                <ul className="text-sm space-y-1 ml-6 list-disc">
                                  <li>Sanitize HTML content before rendering</li>
                                  <li>Implement Content Security Policy (CSP) headers</li>
                                  <li>Encode output when displaying {vuln.field}</li>
                                  <li>Add input validation to reject script tags</li>
                                </ul>
                              )}
                              {vuln.test_type === 'Special Chars' && (
                                <ul className="text-sm space-y-1 ml-6 list-disc">
                                  <li>Add character whitelist validation</li>
                                  <li>Implement proper encoding for special characters</li>
                                  <li>Add length constraints on {vuln.field}</li>
                                  <li>Sanitize null bytes and control characters</li>
                                </ul>
                              )}
                              {vuln.test_type === 'Format String' && (
                                <ul className="text-sm space-y-1 ml-6 list-disc">
                                  <li>Validate and reject format string characters</li>
                                  <li>Use safe string formatting methods</li>
                                  <li>Add input validation on {vuln.field}</li>
                                </ul>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(vuln.test_value);
                                  toast({ title: "Copied", description: "Test value copied to clipboard" });
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Test Value
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open('https://owasp.org/www-project-top-ten/', '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                OWASP Guidelines
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {fuzzResult.all_tests && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        All Test Results
                      </CardTitle>
                      <CardDescription>
                        Detailed results for all {fuzzResult.all_tests.length} fuzz tests
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {fuzzResult.all_tests.map((test: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              test.actual_result === 'rejected' ? 'bg-green-50 dark:bg-green-950/20' : 
                              test.actual_result === 'accepted' ? 'bg-red-50 dark:bg-red-950/20' : 
                              'bg-yellow-50 dark:bg-yellow-950/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {test.actual_result === 'rejected' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : test.actual_result === 'accepted' ? (
                                <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">{test.test_type}</Badge>
                                  <span className="text-sm font-medium">{test.table}.{test.field}</span>
                                </div>
                                {test.error_message && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {test.error_message}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant={test.actual_result === 'rejected' ? 'default' : 'destructive'}
                              className="ml-2"
                            >
                              {test.actual_result}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="flows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Database Flow Tracing
                </CardTitle>
                <CardDescription>Trace data flows through the database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button onClick={() => traceFlow('workflow')} disabled={isTracing} variant="outline">
                    Trace Workflow Flow
                  </Button>
                  <Button onClick={() => traceFlow('compliance')} disabled={isTracing} variant="outline">
                    Trace Compliance Flow
                  </Button>
                  <Button onClick={() => traceFlow('knowledge')} disabled={isTracing} variant="outline">
                    Trace Knowledge Flow
                  </Button>
                </div>

                {flowTrace && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-4">
                      <Badge>{flowTrace.flow}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {flowTrace.summary.total_operations} operations across {flowTrace.summary.tables_affected.length} tables
                      </span>
                    </div>

                    <div className="space-y-2">
                      {flowTrace.steps.map((step: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{step.operation}</Badge>
                          <span className="font-medium">{step.table}</span>
                          <span className="text-sm text-muted-foreground">
                            {step.record_count} record(s)
                          </span>
                          {step.related_tables && (
                            <span className="text-xs text-muted-foreground">
                              → {step.related_tables.join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
