import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { LogOut, DollarSign, Users, TrendingUp, CreditCard, Info, Percent, Calendar, ChevronDown, FileText, Receipt } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";
import { useDemoMode } from "@/hooks/useDemoMode";
import DashboardNavigation from "@/components/DashboardNavigation";
import MCPServerStatus from "@/components/MCPServerStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FinancialMetrics {
  totalCustomers: number;
  activeSubscriptions: number;
  mrr: number;
  mrrFormatted: string;
  growth: number;
  growthFormatted: string;
  arpu: number;
  arpuFormatted: string;
  churnRate: number;
  churnRateFormatted: string;
  revenueByPlan: {
    starter: number;
    professional: number;
    enterprise: number;
  };
  calculations: {
    mrrBreakdown: string;
    growthBreakdown: string;
    arpuBreakdown: string;
    churnBreakdown: string;
  };
}

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const isPreviewMode = useDemoMode();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<FinancialMetrics>({
    totalCustomers: 0,
    activeSubscriptions: 0,
    mrr: 0,
    mrrFormatted: "$0",
    growth: 0,
    growthFormatted: "0%",
    arpu: 0,
    arpuFormatted: "$0",
    churnRate: 0,
    churnRateFormatted: "0%",
    revenueByPlan: {
      starter: 0,
      professional: 0,
      enterprise: 0
    },
    calculations: {
      mrrBreakdown: "",
      growthBreakdown: "",
      arpuBreakdown: "",
      churnBreakdown: ""
    }
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    if (isPreviewMode) {
      setUserProfile({ full_name: "Demo User", department: "finance" });
      await fetchStats();
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    setUserProfile(profile);
    await fetchStats();
    setIsLoading(false);
  };

  const calculateFinancialMetrics = (allCustomers: any[]): FinancialMetrics => {
    // Plan pricing (monthly)
    const planPricing = {
      starter: 99,
      professional: 299,
      enterprise: 999
    };

    // Filter active customers
    const activeCustomers = allCustomers.filter(c => c.status === "active");
    const totalCustomers = allCustomers.length;
    const activeCount = activeCustomers.length;

    // Calculate MRR by plan type
    const revenueByPlan = {
      starter: activeCustomers.filter(c => c.plan_type === "starter").length * planPricing.starter,
      professional: activeCustomers.filter(c => c.plan_type === "professional").length * planPricing.professional,
      enterprise: activeCustomers.filter(c => c.plan_type === "enterprise").length * planPricing.enterprise
    };

    const mrr = revenueByPlan.starter + revenueByPlan.professional + revenueByPlan.enterprise;

    // Calculate previous month MRR (simulated - in production, query historical data)
    const previousMonthMRR = mrr * 0.89; // Simulated 11% growth
    const growth = previousMonthMRR > 0 ? ((mrr - previousMonthMRR) / previousMonthMRR) * 100 : 0;

    // Calculate ARPU (Average Revenue Per User)
    const arpu = activeCount > 0 ? mrr / activeCount : 0;

    // Calculate churn rate (simulated - in production, track cancellations over time)
    const churnedCustomers = allCustomers.filter(c => c.status === "inactive" || c.status === "cancelled").length;
    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

    // Create detailed calculation breakdowns
    const mrrBreakdown = `
MRR Calculation:
• Starter Plan: ${activeCustomers.filter(c => c.plan_type === "starter").length} customers × $${planPricing.starter} = $${revenueByPlan.starter.toLocaleString()}
• Professional Plan: ${activeCustomers.filter(c => c.plan_type === "professional").length} customers × $${planPricing.professional} = $${revenueByPlan.professional.toLocaleString()}
• Enterprise Plan: ${activeCustomers.filter(c => c.plan_type === "enterprise").length} customers × $${planPricing.enterprise} = $${revenueByPlan.enterprise.toLocaleString()}
━━━━━━━━━━━━━━━━━━
Total MRR: $${mrr.toLocaleString()}
    `.trim();

    const growthBreakdown = `
Growth Rate Calculation:
• Current Month MRR: $${mrr.toLocaleString()}
• Previous Month MRR: $${previousMonthMRR.toLocaleString()}
• Change: $${(mrr - previousMonthMRR).toLocaleString()}
• Growth Rate: ((${mrr.toLocaleString()} - ${previousMonthMRR.toLocaleString()}) / ${previousMonthMRR.toLocaleString()}) × 100 = ${growth.toFixed(1)}%
    `.trim();

    const arpuBreakdown = `
ARPU Calculation:
• Total MRR: $${mrr.toLocaleString()}
• Active Customers: ${activeCount}
• ARPU: $${mrr.toLocaleString()} ÷ ${activeCount} = $${arpu.toFixed(2)}

This represents the average monthly revenue generated per active customer.
    `.trim();

    const churnBreakdown = `
Churn Rate Calculation:
• Churned Customers: ${churnedCustomers}
• Total Customers: ${totalCustomers}
• Churn Rate: (${churnedCustomers} ÷ ${totalCustomers}) × 100 = ${churnRate.toFixed(2)}%

Churn rate represents the percentage of customers who have cancelled or become inactive.
    `.trim();

    return {
      totalCustomers,
      activeSubscriptions: activeCount,
      mrr,
      mrrFormatted: `$${mrr.toLocaleString()}`,
      growth,
      growthFormatted: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      arpu,
      arpuFormatted: `$${arpu.toFixed(2)}`,
      churnRate,
      churnRateFormatted: `${churnRate.toFixed(2)}%`,
      revenueByPlan,
      calculations: {
        mrrBreakdown,
        growthBreakdown,
        arpuBreakdown,
        churnBreakdown
      }
    };
  };

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch financial data");
    } else {
      const allCustomers = data || [];
      setCustomers(allCustomers.slice(0, 10)); // Show only 10 most recent in table
      const metrics = calculateFinancialMetrics(allCustomers);
      setStats(metrics);
    }
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
            <DollarSign className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Finance Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userProfile?.full_name}</span>
            {isPreviewMode && <Badge variant="outline">Preview Mode</Badge>}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              {isPreviewMode ? "Back to Demos" : "Sign Out"}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <DashboardNavigation 
          title="Finance Dashboard"
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
        
        {/* Quick Access Menu Bar */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {/* Finance Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Finance Tools
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>Finance Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/workflow/billing?department=finance')}>
                <Receipt className="h-4 w-4 mr-2" />
                Billing Management
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/workflow/invoices?department=finance')}>
                <FileText className="h-4 w-4 mr-2" />
                Invoices
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/workflow/subscriptions?department=finance')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Subscriptions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reports Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>Financial Reports</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/analytics?department=finance')}>
                Financial Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/workflow/revenue-reports?department=finance')}>
                Revenue Reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <TooltipProvider>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/workflow/revenue?metric=Monthly Revenue&department=finance`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{stats.calculations.mrrBreakdown}</pre>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.mrrFormatted}</div>
                <p className={`text-xs mt-1 ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.growthFormatted} from last month
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/workflow/customers?metric=Total Customers&department=finance`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="default" className="text-xs">{stats.activeSubscriptions} active</Badge>
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalCustomers - stats.activeSubscriptions} inactive
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/workflow/growth?metric=Growth Rate&department=finance`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{stats.calculations.growthBreakdown}</pre>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.growthFormatted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Month over month</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/workflow/arpu?metric=ARPU&department=finance`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{stats.calculations.arpuBreakdown}</pre>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.arpuFormatted}</div>
                <p className="text-xs text-muted-foreground mt-1">Average revenue per user</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{stats.calculations.churnBreakdown}</pre>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.churnRateFormatted}</div>
                <p className="text-xs text-muted-foreground mt-1">Customer cancellation rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Starter:</span>
                  <span className="font-medium">${stats.revenueByPlan.starter.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Professional:</span>
                  <span className="font-medium">${stats.revenueByPlan.professional.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Enterprise:</span>
                  <span className="font-medium">${stats.revenueByPlan.enterprise.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Annual Projections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ARR:</span>
                  <span className="font-medium">${(stats.mrr * 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Projected Growth:</span>
                  <span className="font-medium">${(stats.mrr * 12 * (stats.growth / 100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Year-End Target:</span>
                  <span className="font-medium">${(stats.mrr * 12 * (1 + stats.growth / 100)).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TooltipProvider>

        <Card>
          <CardHeader>
            <CardTitle>Recent Customers</CardTitle>
            <CardDescription>Latest customer subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.company_name}</TableCell>
                    <TableCell>{customer.plan_type}</TableCell>
                    <TableCell>
                      <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <MCPServerStatus filterByServerType="finance" />

        <DepartmentAIAssistant 
          department="finance" 
          departmentLabel="Finance" 
        />
      </div>
    </div>
  );
};

export default FinanceDashboard;
