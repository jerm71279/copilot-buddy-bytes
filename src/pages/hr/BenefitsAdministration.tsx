import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, Search, Users, DollarSign, Shield } from "lucide-react";
import { toast } from "sonner";

interface BenefitPlan {
  id: string;
  plan_name: string;
  category: string;
  provider: string;
  employee_cost_monthly: number;
  employer_cost_monthly: number;
  is_active: boolean;
  enrollment_count?: number;
}

const BenefitsAdministration = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    totalEnrollments: 0,
    totalEmployerCost: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.customer_id) {
        toast.error("No customer profile found");
        return;
      }

      // Load benefit plans
      const { data: plansData, error: plansError } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("customer_id", profile.customer_id)
        .order("plan_name");

      if (plansError) throw plansError;

      // Load enrollments
      const { data: enrollmentsData } = await supabase
        .from("employee_benefit_enrollments")
        .select("benefit_plan_id, status, employer_contribution")
        .eq("customer_id", profile.customer_id)
        .eq("status", "active");

      const enrollmentCounts = enrollmentsData?.reduce((acc: any, enr) => {
        acc[enr.benefit_plan_id] = (acc[enr.benefit_plan_id] || 0) + 1;
        return acc;
      }, {});

      const plansWithCounts = plansData?.map(plan => ({
        ...plan,
        enrollment_count: enrollmentCounts?.[plan.id] || 0
      })) || [];

      setPlans(plansWithCounts);

      // Calculate total employer cost
      const totalCost = enrollmentsData?.reduce((sum, enr) => sum + (enr.employer_contribution || 0), 0) || 0;

      setStats({
        totalPlans: plansData?.length || 0,
        activePlans: plansData?.filter(p => p.is_active).length || 0,
        totalEnrollments: enrollmentsData?.length || 0,
        totalEmployerCost: totalCost,
      });

    } catch (error: any) {
      console.error("Error loading benefits data:", error);
      toast.error("Failed to load benefits data");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.provider?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || plan.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(plans.map(p => p.category)));

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      health: Heart,
      dental: Heart,
      vision: Heart,
      life: Shield,
      disability: Shield,
      retirement: DollarSign,
    };
    const Icon = icons[category.toLowerCase()] || Heart;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Benefits Administration</h1>
          <p className="text-muted-foreground">Manage employee benefit plans and enrollments</p>
        </div>
        <Button onClick={() => navigate("/hr/benefits/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Benefit Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Employer Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEmployerCost.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search benefit plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Benefit Plans List */}
      <div className="grid gap-4">
        {filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No benefit plans found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/hr/benefits/new")}
              >
                Create First Benefit Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPlans.map((plan) => (
            <Card 
              key={plan.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate(`/hr/benefits/${plan.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(plan.category)}
                      {plan.plan_name}
                    </CardTitle>
                    <CardDescription>
                      {plan.category} • {plan.provider}
                    </CardDescription>
                  </div>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Employee: ${plan.employee_cost_monthly}/mo</span>
                    <span>Employer: ${plan.employer_cost_monthly}/mo</span>
                    <span>{plan.enrollment_count} enrolled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BenefitsAdministration;