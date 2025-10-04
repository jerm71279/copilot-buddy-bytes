import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LogOut, TrendingUp, Users, DollarSign, Target, ArrowUpRight, Calendar } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useDemoMode } from "@/hooks/useDemoMode";

const SalesDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRevenue: 1250000,
    activeDeals: 24,
    customerCount: 187,
    conversionRate: 32,
    monthlyGrowth: 18
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "sales" });
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check permissions using RBAC
    const { data: hasPermission } = await supabase
      .rpc('has_permission', {
        _user_id: session.user.id,
        _resource_type: 'dashboard',
        _resource_name: 'sales',
        _min_permission: 'view'
      });

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Allow access if user has permission OR has correct department
    if (!hasPermission && (!profile || profile.department !== "sales")) {
      toast.error("Access denied: Sales department access required");
      navigate("/");
      return;
    }

    setUserProfile(profile);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      navigate("/demo");
      return;
    }
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Sales Dashboard</h1>
            {isPreviewMode && (
              <Badge variant="secondary" className="ml-2">Preview Mode</Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {userProfile?.full_name || "Sales User"}
            </span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              {isPreviewMode ? "Back to Demos" : "Sign Out"}
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Sales Performance</h2>
          <p className="text-muted-foreground">
            Track revenue, pipeline, and customer metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalRevenue / 1000000).toFixed(2)}M</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+{stats.monthlyGrowth}% from last month</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDeals}</div>
              <p className="text-xs text-muted-foreground">
                In pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customerCount}</div>
              <p className="text-xs text-muted-foreground">
                Active accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <Progress value={stats.conversionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Sales Pipeline */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>Active opportunities by stage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Qualification</span>
                  <span className="font-medium">8 deals - $320K</span>
                </div>
                <Progress value={33} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Proposal</span>
                  <span className="font-medium">6 deals - $450K</span>
                </div>
                <Progress value={25} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Negotiation</span>
                  <span className="font-medium">5 deals - $280K</span>
                </div>
                <Progress value={21} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Closing</span>
                  <span className="font-medium">5 deals - $200K</span>
                </div>
                <Progress value={21} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Opportunities</CardTitle>
              <CardDescription>Highest value deals in pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enterprise Corp</p>
                    <p className="text-sm text-muted-foreground">Network Infrastructure</p>
                  </div>
                  <Badge variant="default">$120K</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tech Solutions Inc</p>
                    <p className="text-sm text-muted-foreground">Security Cameras & IT</p>
                  </div>
                  <Badge variant="default">$95K</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Global Services Ltd</p>
                    <p className="text-sm text-muted-foreground">Phone System Install</p>
                  </div>
                  <Badge variant="default">$78K</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Modern Office Co</p>
                    <p className="text-sm text-muted-foreground">Complete IT Package</p>
                  </div>
                  <Badge variant="default">$65K</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Forecast */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest sales interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Demo scheduled - Enterprise Corp</p>
                    <p className="text-sm text-muted-foreground">Network infrastructure solution - Tomorrow 2:00 PM</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Proposal sent - Tech Solutions</p>
                    <p className="text-sm text-muted-foreground">Security camera system - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Deal closed - Retail Partners</p>
                    <p className="text-sm text-muted-foreground">Phone system installation - Today</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Follow-up call - Modern Office</p>
                    <p className="text-sm text-muted-foreground">Complete IT package discussion - Yesterday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quarterly Forecast</CardTitle>
              <CardDescription>Projected vs. actual performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Q1 Target: $1.5M</span>
                  <span className="font-medium text-green-600">$1.6M (107%)</span>
                </div>
                <Progress value={107} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Q2 Target: $1.8M</span>
                  <span className="font-medium">$1.25M (69%)</span>
                </div>
                <Progress value={69} className="h-2" />
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Forecast Insights</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 5 deals likely to close this week ($450K)</li>
                  <li>• Q2 on track to meet 95% of target</li>
                  <li>• Network infrastructure deals trending up 25%</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant */}
        <DepartmentAIAssistant department="sales" departmentLabel="Sales" />
      </main>
    </div>
  );
};

export default SalesDashboard;
