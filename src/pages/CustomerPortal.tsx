import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Clock, FileText, BookOpen, Workflow, BarChart3, Settings, ExternalLink, Brain, Zap, Calendar, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import EmployeeToolbar from "@/components/EmployeeToolbar";

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [recentWorkflows, setRecentWorkflows] = useState<any[]>([]);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get customer profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*, customers(*)")
        .eq("user_id", session.user.id)
        .single();

      setCustomerData(profile);

      if (profile?.customer_id) {
        // Load recent knowledge articles
        const { data: articles } = await supabase
          .from("knowledge_articles")
          .select("*")
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(5);

        setRecentArticles(articles || []);

        // Load recent workflow executions
        const { data: workflows } = await supabase
          .from("workflow_executions")
          .select("*")
          .eq("customer_id", profile.customer_id)
          .order("started_at", { ascending: false })
          .limit(5);

        setRecentWorkflows(workflows || []);
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Quick access tools
  const quickAccessTools = [
    { name: "Knowledge Base", icon: BookOpen, path: "/knowledge", description: "SOPs, guides, and documentation" },
    { name: "Workflows", icon: Workflow, path: "/workflow/automation", description: "Process automation and execution" },
    { name: "AI Assistant", icon: Brain, path: "/portal", description: "Get AI-powered help and insights" },
    { name: "Integrations", icon: Zap, path: "/integrations", description: "Connected systems and tools" },
  ];

  // Analytics/Dashboards - Secondary access
  const analyticsDashboards = [
    { name: "Operations", icon: BarChart3, path: "/dashboard/operations", description: "Workflow metrics and insights" },
    { name: "Compliance", icon: Shield, path: "/dashboard/compliance", description: "Compliance status and reports" },
    { name: "IT Systems", icon: Activity, path: "/dashboard/it", description: "System health and performance" },
    { name: "Executive", icon: BarChart3, path: "/dashboard/executive", description: "High-level business metrics" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">
                  My Workspace
                </h1>
                <p className="text-sm text-muted-foreground">
                  {customerData?.customers?.company_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/analytics">
                <Button variant="outline">Analytics Portal</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Employee System Toolbar */}
      <EmployeeToolbar />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {customerData?.first_name || "Employee"}
          </h2>
          <p className="text-muted-foreground">
            Access your tools, knowledge, and insights all in one place
          </p>
        </div>

        {/* Quick Access Tools - PRIMARY */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold">Quick Access</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickAccessTools.map((tool) => (
              <Link key={tool.name} to={tool.path}>
                <Card className="hover:shadow-lg transition-all hover:border-primary cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <tool.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6">Recent Activity</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Knowledge Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recent Documentation
                </CardTitle>
                <CardDescription>Recently updated guides and SOPs</CardDescription>
              </CardHeader>
              <CardContent>
                {recentArticles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent articles</p>
                ) : (
                  <div className="space-y-3">
                    {recentArticles.slice(0, 3).map((article) => (
                      <Link
                        key={article.id}
                        to={`/knowledge/${article.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{article.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(article.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                    ))}
                    <Link to="/knowledge">
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        View All Documentation
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Workflow Executions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Recent Workflows
                </CardTitle>
                <CardDescription>Latest workflow executions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentWorkflows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent workflows</p>
                ) : (
                  <div className="space-y-3">
                    {recentWorkflows.slice(0, 3).map((workflow) => (
                      <div
                        key={workflow.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Zap className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{workflow.workflow_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={workflow.status === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {workflow.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {new Date(workflow.started_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Analytics & Insights - SECONDARY */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold">Analytics & Insights</h3>
            <p className="text-sm text-muted-foreground">Explore detailed metrics and reports</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticsDashboards.map((dashboard) => (
              <Link key={dashboard.name} to={dashboard.path}>
                <Card className="hover:shadow-md transition-all hover:border-muted-foreground/50 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <dashboard.icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{dashboard.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {dashboard.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerPortal;
