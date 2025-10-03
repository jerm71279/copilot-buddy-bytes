import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LogOut, Shield, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { DepartmentAIAssistant } from "@/components/DepartmentAIAssistant";

const ComplianceDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    frameworks: 0,
    controls: 0,
    reports: 0,
    evidenceFiles: 0,
    complianceScore: 92
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile || profile.department !== "compliance") {
      toast.error("Access denied: Compliance department access required");
      navigate("/");
      return;
    }

    setUserProfile(profile);
    await fetchStats();
    setIsLoading(false);
  };

  const fetchStats = async () => {
    const [frameworks, controls, reports, evidence] = await Promise.all([
      supabase.from("compliance_frameworks").select("*", { count: "exact", head: true }),
      supabase.from("compliance_controls").select("*", { count: "exact", head: true }),
      supabase.from("compliance_reports").select("*", { count: "exact", head: true }),
      supabase.from("evidence_files").select("*", { count: "exact", head: true })
    ]);

    setStats({
      frameworks: frameworks.count || 0,
      controls: controls.count || 0,
      reports: reports.count || 0,
      evidenceFiles: evidence.count || 0,
      complianceScore: 92
    });
  };

  const handleSignOut = async () => {
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
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Compliance Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userProfile?.full_name}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.complianceScore}%</div>
              <Progress value={stats.complianceScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Frameworks</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.frameworks}</div>
              <p className="text-xs text-muted-foreground mt-1">SOC 2, GDPR, HIPAA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Controls</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.controls}</div>
              <p className="text-xs text-muted-foreground mt-1">Active monitoring</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evidence Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evidenceFiles}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.reports} reports</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Framework Coverage</CardTitle>
            <CardDescription>Compliance status across frameworks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">SOC 2 Type II</span>
                <Badge>95% Complete</Badge>
              </div>
              <Progress value={95} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">GDPR</span>
                <Badge>88% Complete</Badge>
              </div>
              <Progress value={88} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">HIPAA</span>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <Progress value={72} />
            </div>
          </CardContent>
        </Card>

        <DepartmentAIAssistant 
          department="compliance" 
          departmentLabel="Compliance & GRC" 
        />
      </div>
    </div>
  );
};

export default ComplianceDashboard;
