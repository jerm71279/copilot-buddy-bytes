import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Shield,
  Database,
  Workflow,
  FileText,
  Users,
  Settings,
  TrendingUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useStandardToast } from "@/hooks/useStandardToast";
import { SystemValidationService, ValidationResult, TestResult } from "@/services/systemValidationService";

export default function SystemValidationDashboard() {
  const showToast = useStandardToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const runValidationTests = async () => {
    setIsRunning(true);
    setResults([]);
    setOverallProgress(0);

    const validationResults: ValidationResult[] = [];

    try {
      // 1. Database Schema Validation
      setOverallProgress(10);
      const dbTests = await SystemValidationService.validateDatabaseSchema();
      validationResults.push({
        category: 'Database Schema',
        tests: dbTests,
        passRate: SystemValidationService.calculatePassRate(dbTests)
      });

      // 2. RLS Policy Validation
      setOverallProgress(25);
      const rlsTests = await SystemValidationService.validateRLSPolicies();
      validationResults.push({
        category: 'Row Level Security',
        tests: rlsTests,
        passRate: SystemValidationService.calculatePassRate(rlsTests)
      });

      // 3. Edge Function Validation
      setOverallProgress(40);
      const functionTests = await SystemValidationService.validateEdgeFunctions();
      validationResults.push({
        category: 'Edge Functions',
        tests: functionTests,
        passRate: SystemValidationService.calculatePassRate(functionTests)
      });

      // 4. Data Integrity Validation
      setOverallProgress(60);
      const dataTests = await SystemValidationService.validateDataIntegrity();
      validationResults.push({
        category: 'Data Integrity',
        tests: dataTests,
        passRate: SystemValidationService.calculatePassRate(dataTests)
      });

      // 5. Performance Validation
      setOverallProgress(80);
      const perfTests = await SystemValidationService.validatePerformance();
      validationResults.push({
        category: 'Performance',
        tests: perfTests,
        passRate: SystemValidationService.calculatePassRate(perfTests)
      });

      // 6. UI Component Validation
      setOverallProgress(90);
      const uiTests = SystemValidationService.validateUIComponents();
      validationResults.push({
        category: 'UI Components',
        tests: uiTests,
        passRate: 100
      });

      setOverallProgress(100);
      setResults(validationResults);

      const totalTests = validationResults.reduce((sum, r) => sum + r.tests.length, 0);
      const passedTests = validationResults.reduce(
        (sum, r) => sum + r.tests.filter(t => t.status === 'passed').length, 
        0
      );

      if (passedTests === totalTests) {
        showToast.success("Validation Complete", { description: `${passedTests}/${totalTests} tests passed` });
      } else {
        showToast.error("Validation Complete", { description: `${passedTests}/${totalTests} tests passed` });
      }

    } catch (error) {
      showToast.error("Validation Error", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Database Schema':
        return <Database className="h-5 w-5" />;
      case 'Row Level Security':
        return <Shield className="h-5 w-5" />;
      case 'Edge Functions':
        return <Settings className="h-5 w-5" />;
      case 'Data Integrity':
        return <FileText className="h-5 w-5" />;
      case 'Performance':
        return <TrendingUp className="h-5 w-5" />;
      case 'UI Components':
        return <Users className="h-5 w-5" />;
      default:
        return <Workflow className="h-5 w-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">System Validation Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive validation and testing of all system components
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run System Validation
            </CardTitle>
            <CardDescription>
              Tests database schema, RLS policies, edge functions, data integrity, performance, and UI components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runValidationTests} 
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Validation... {overallProgress}%
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Validation
                </>
              )}
            </Button>

            {isRunning && (
              <div className="space-y-2">
                <Progress value={overallProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Testing system components...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-6">
            {/* Overall Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {results.map((result) => (
                    <div key={result.category} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(result.category)}
                        <p className="text-sm font-medium">{result.category}</p>
                      </div>
                      <p className="text-2xl font-bold">{result.passRate.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">
                        {result.tests.filter(t => t.status === 'passed').length}/{result.tests.length} passed
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Tabs defaultValue={results[0]?.category} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
                {results.map((result) => (
                  <TabsTrigger key={result.category} value={result.category}>
                    {result.category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {results.map((result) => (
                <TabsContent key={result.category} value={result.category} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getCategoryIcon(result.category)}
                        {result.category} Tests
                      </CardTitle>
                      <CardDescription>
                        {result.tests.length} tests • {result.passRate.toFixed(0)}% pass rate
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.tests.map((test, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                              test.status === 'passed'
                                ? 'bg-success/5 border-success/20'
                                : test.status === 'warning'
                                ? 'bg-warning/5 border-warning/20'
                                : 'bg-destructive/5 border-destructive/20'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                {getStatusIcon(test.status)}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">{test.name}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {test.message}
                                  </p>
                                  {test.details && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {test.details}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge 
                                variant={
                                  test.status === 'passed' 
                                    ? 'default' 
                                    : test.status === 'warning'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {test.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Recommendations */}
            {results.some(r => r.tests.some(t => t.status !== 'passed')) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  Some tests did not pass. Review the failed tests above and take corrective action to ensure system reliability.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
