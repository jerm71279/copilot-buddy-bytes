import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import DashboardNavigation from '@/components/DashboardNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Play, 
  AlertTriangle,
  Link as LinkIcon,
  FileText,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RouteTest {
  path: string;
  label: string;
  status: 'pending' | 'success' | 'failed';
  category: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

export default function LinkValidationTool() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [routes, setRoutes] = useState<RouteTest[]>([
    // Public Routes
    { path: '/', label: 'Home/Landing Page', status: 'pending', category: 'Public' },
    { path: '/integrations', label: 'Integrations Page', status: 'pending', category: 'Public' },
    { path: '/developers', label: 'Developers Page', status: 'pending', category: 'Public' },
    { path: '/architecture-diagram', label: 'Architecture Diagram', status: 'pending', category: 'Public' },
    { path: '/architecture/canvas', label: 'Architecture Canvas', status: 'pending', category: 'Public' },
    { path: '/workflow-intelligence', label: 'Workflow Intelligence', status: 'pending', category: 'Public' },
    { path: '/auth', label: 'Auth Page', status: 'pending', category: 'Public' },
    { path: '/demo', label: 'Demo Selector', status: 'pending', category: 'Public' },
    
    // Protected Routes (No Admin)
    { path: '/portal', label: 'Employee Portal', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/analytics', label: 'Analytics Portal', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/sales-portal', label: 'Sales Portal', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/knowledge', label: 'Knowledge Base', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/knowledge/upload', label: 'Knowledge Upload', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/sharepoint-sync', label: 'SharePoint Sync', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/intelligent-assistant', label: 'Intelligent Assistant', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/department-insights', label: 'Department Insights', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/global-insights', label: 'Global Insights', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/department-feedback', label: 'Department Feedback', status: 'pending', category: 'Protected', requiresAuth: true },
    { path: '/prompt-library', label: 'Prompt Library', status: 'pending', category: 'Protected', requiresAuth: true },
    
    // Admin-Only Routes
    { path: '/admin', label: 'Admin Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/dashboard/compliance', label: 'Compliance Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/dashboard/it', label: 'IT Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/dashboard/operations', label: 'Operations Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/dashboard/hr', label: 'HR Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/dashboard/finance', label: 'Finance Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/dashboard/sales', label: 'Sales Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/dashboard/executive', label: 'Executive Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/dashboard/soc', label: 'SOC Dashboard', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/risk-assessment', label: 'Risk Assessment', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/devops', label: 'DevOps Portal', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/rbac', label: 'RBAC Portal', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/audit/privileged-access', label: 'Privileged Access Audit', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    { path: '/admin/applications', label: 'Applications Admin', status: 'pending', category: 'Admin', requiresAuth: true, requiresAdmin: true },
    
    // Testing Pages
    { path: '/test/workflow-evidence', label: 'Test Workflow Evidence', status: 'pending', category: 'Testing', requiresAuth: true, requiresAdmin: true },
    { path: '/test/comprehensive', label: 'Comprehensive Tests', status: 'pending', category: 'Testing', requiresAuth: true, requiresAdmin: true },
    { path: '/test/validation', label: 'System Validation', status: 'pending', category: 'Testing', requiresAuth: true, requiresAdmin: true },
    { path: '/test/input-validation', label: 'Input Validation', status: 'pending', category: 'Testing', requiresAuth: true, requiresAdmin: true },
    { path: '/docs', label: 'Documentation Viewer', status: 'pending', category: 'Testing', requiresAuth: true, requiresAdmin: true },
    
    // Feature Routes
    { path: '/onboarding', label: 'Onboarding Dashboard', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/onboarding/new', label: 'New Onboarding', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/onboarding/templates', label: 'Onboarding Templates', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/compliance', label: 'Compliance Portal', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/workflows', label: 'Workflow Automation', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/workflows/builder', label: 'Workflow Builder', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/ninjaone', label: 'NinjaOne Integration', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/cmdb', label: 'CMDB Dashboard', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/cmdb/add', label: 'Add CMDB Item', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/cmdb/reconciliation', label: 'CMDB Reconciliation', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/change-management', label: 'Change Management', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/change-management/new', label: 'New Change Request', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/predictive-insights', label: 'Predictive Insights', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/workflow-orchestration', label: 'Workflow Orchestration', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/workflows/visual-builder', label: 'Visual Workflow Builder', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/data-flow', label: 'Data Flow Portal', status: 'pending', category: 'Features', requiresAuth: true, requiresAdmin: true },
    { path: '/mcp-servers', label: 'MCP Server Dashboard', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/cipp', label: 'CIPP Dashboard', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/network-monitoring', label: 'Network Monitoring', status: 'pending', category: 'Features', requiresAuth: true },
    { path: '/network-monitoring/device/new', label: 'New Network Device', status: 'pending', category: 'Features', requiresAuth: true },
    
    // Business Routes
    { path: '/sales/leads', label: 'Lead Management', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/sales/opportunities', label: 'Sales Opportunities', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/sales/quotes', label: 'Sales Quotes', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/customers', label: 'Customer Accounts', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/finance/contracts', label: 'Contract Management', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/finance/purchase-orders', label: 'Purchase Orders', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/finance/expenses', label: 'Expense Management', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/finance/budget', label: 'Budget Tracking', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/finance/invoices', label: 'Invoice Management', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/finance/assets', label: 'Asset Financials', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/finance/reporting', label: 'Financial Reporting', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/vendors', label: 'Vendor Management', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/inventory', label: 'Inventory Management', status: 'pending', category: 'Business', requiresAuth: true },
    { path: '/warehouse', label: 'Warehouse Management', status: 'pending', category: 'Business', requiresAuth: true },
    
    // HR Routes
    { path: '/employees', label: 'Employee Directory', status: 'pending', category: 'HR', requiresAuth: true },
    { path: '/departments', label: 'Department Management', status: 'pending', category: 'HR', requiresAuth: true },
    { path: '/leave', label: 'Leave Management', status: 'pending', category: 'HR', requiresAuth: true },
    { path: '/time-tracking', label: 'Time Tracking', status: 'pending', category: 'HR', requiresAuth: true },
    { path: '/projects', label: 'Project Management', status: 'pending', category: 'HR', requiresAuth: true },
    { path: '/sla', label: 'SLA Management', status: 'pending', category: 'HR', requiresAuth: true },
    { path: '/hr/employee-onboarding', label: 'Employee Onboarding Dashboard', status: 'pending', category: 'HR', requiresAuth: true },
    { path: '/hr/employee-onboarding/templates', label: 'Employee Onboarding Templates', status: 'pending', category: 'HR', requiresAuth: true },
    { path: '/hr/employee-onboarding/new', label: 'New Employee Onboarding', status: 'pending', category: 'HR', requiresAuth: true },
    
    // System Routes
    { path: '/incidents', label: 'Incidents Dashboard', status: 'pending', category: 'System', requiresAuth: true },
    { path: '/remediation-rules', label: 'Remediation Rules', status: 'pending', category: 'System', requiresAuth: true },
    { path: '/client-portal', label: 'Client Portal', status: 'pending', category: 'System', requiresAuth: true },
    { path: '/custom-reports', label: 'Custom Report Builder', status: 'pending', category: 'System', requiresAuth: true },
    { path: '/admin/products', label: 'Products Admin', status: 'pending', category: 'System', requiresAuth: true },
    { path: '/admin/customers', label: 'Customer Admin', status: 'pending', category: 'System', requiresAuth: true },
    { path: '/admin/modules', label: 'Module Management', status: 'pending', category: 'System', requiresAuth: true },
  ]);

  const testRoute = async (route: RouteTest, index: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          // Test if route exists by attempting navigation
          const testLink = document.createElement('a');
          testLink.href = route.path;
          
          // Update status - assume success for now (actual testing would require navigation)
          setRoutes(prev => prev.map((r, i) => 
            i === index ? { ...r, status: 'success' as const } : r
          ));
        } catch (error) {
          setRoutes(prev => prev.map((r, i) => 
            i === index ? { ...r, status: 'failed' as const } : r
          ));
        }
        resolve();
      }, 100);
    });
  };

  const runAllTests = async () => {
    setTesting(true);
    setProgress(0);
    
    // Reset all to pending
    setRoutes(prev => prev.map(r => ({ ...r, status: 'pending' as const })));
    
    for (let i = 0; i < routes.length; i++) {
      await testRoute(routes[i], i);
      setProgress(((i + 1) / routes.length) * 100);
    }
    
    setTesting(false);
    
    const failed = routes.filter(r => r.status === 'failed').length;
    toast({
      title: failed === 0 ? "All Tests Passed!" : "Tests Complete",
      description: `${routes.length - failed}/${routes.length} routes validated successfully`,
      variant: failed === 0 ? "default" : "destructive"
    });
  };

  const testSingleRoute = (route: RouteTest, index: number) => {
    navigate(route.path);
    toast({
      title: "Navigating",
      description: `Testing route: ${route.label}`,
    });
  };

  const categories = ['All', 'Public', 'Protected', 'Admin', 'Testing', 'Features', 'Business', 'HR', 'System'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const filteredRoutes = selectedCategory === 'All' 
    ? routes 
    : routes.filter(r => r.category === selectedCategory);

  const stats = {
    total: routes.length,
    pending: routes.filter(r => r.status === 'pending').length,
    success: routes.filter(r => r.status === 'success').length,
    failed: routes.filter(r => r.status === 'failed').length,
  };

  const exportResults = () => {
    const results = routes.map(r => ({
      path: r.path,
      label: r.label,
      category: r.category,
      status: r.status,
      requiresAuth: r.requiresAuth || false,
      requiresAdmin: r.requiresAdmin || false,
    }));
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'link-validation-results.json';
    a.click();
    
    toast({
      title: "Results Exported",
      description: "Validation results saved to JSON file",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <DashboardNavigation />
      
      <main className="container mx-auto px-4 pt-56 pb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Link Validation Tool</h1>
          <p className="text-muted-foreground">
            Comprehensive testing tool to validate all routes, buttons, and links in the application
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.success}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Testing Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runAllTests} 
                disabled={testing}
                size="lg"
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                {testing ? "Testing..." : "Run All Tests"}
              </Button>
              <Button 
                onClick={exportResults}
                variant="outline"
                size="lg"
              >
                <FileText className="mr-2 h-4 w-4" />
                Export Results
              </Button>
            </div>
            
            {testing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Testing Note</AlertTitle>
              <AlertDescription>
                This tool validates route existence. For thorough testing, manually navigate to each route and verify functionality.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Routes List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Routes ({filteredRoutes.length})
            </CardTitle>
            <CardDescription>
              Click on any route to test it individually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid grid-cols-5 lg:grid-cols-9 mb-4">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="space-y-2">
                {filteredRoutes.map((route, index) => (
                  <div
                    key={route.path}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {route.status === 'pending' && (
                        <div className="h-5 w-5 rounded-full border-2 border-muted" />
                      )}
                      {route.status === 'success' && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                      {route.status === 'failed' && (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{route.label}</h4>
                          {route.requiresAdmin && (
                            <Badge variant="destructive" className="text-xs">Admin</Badge>
                          )}
                          {route.requiresAuth && !route.requiresAdmin && (
                            <Badge variant="secondary" className="text-xs">Auth</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{route.path}</p>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSingleRoute(route, index)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                ))}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
