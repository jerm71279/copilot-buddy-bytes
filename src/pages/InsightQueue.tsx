import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  FileText,
  TrendingUp,
  Building2,
  Users,
  Shield,
  Briefcase,
  DollarSign,
  Headphones
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  confidence_score: number;
  relevance_score: number;
  department: string | null;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewed_notes: string | null;
  auto_approved: boolean;
  data_sources: any;
}

const DEPARTMENTS = [
  { value: "it", label: "IT", icon: Building2, color: "text-blue-500" },
  { value: "hr", label: "HR", icon: Users, color: "text-green-500" },
  { value: "security", label: "Security", icon: Shield, color: "text-red-500" },
  { value: "operations", label: "Operations", icon: Briefcase, color: "text-purple-500" },
  { value: "finance", label: "Finance", icon: DollarSign, color: "text-amber-500" },
  { value: "support", label: "Support", icon: Headphones, color: "text-cyan-500" },
];

export default function InsightQueue() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("new");
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [assignDepartment, setAssignDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    filterInsights();
  }, [insights, departmentFilter, statusFilter]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) return;

      const { data, error } = await supabase
        .from('knowledge_insights')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('relevance_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast({
        title: "Error",
        description: "Failed to load insights",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterInsights = () => {
    let filtered = insights;

    if (statusFilter !== "all") {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(i => i.department === departmentFilter);
    }

    setFilteredInsights(filtered);
  };

  const handleApprove = async (insight: Insight) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('knowledge_insights')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewed_notes: reviewNotes || null,
          department: assignDepartment || insight.department
        })
        .eq('id', insight.id);

      if (error) throw error;

      // Auto-create article if it was a high-value insight
      if (insight.confidence_score >= 0.8) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.customer_id) {
          await supabase
            .from('knowledge_articles')
            .insert({
              customer_id: profile.customer_id,
              created_by: user.id,
              title: insight.title,
              content: insight.description,
              article_type: 'guide',
              status: 'published',
              tags: [insight.insight_type, insight.department || 'general'],
              source_type: 'ai_generated',
              source_metadata: {
                generated_from: 'insight_queue',
                insight_id: insight.id,
                confidence_score: insight.confidence_score,
                department: insight.department
              }
            });
        }
      }

      toast({
        title: "Insight approved",
        description: insight.confidence_score >= 0.8 
          ? "High-value insight approved and article created"
          : "Insight approved successfully",
      });

      setSelectedInsight(null);
      setReviewNotes("");
      setAssignDepartment("");
      loadInsights();
    } catch (error) {
      console.error('Error approving insight:', error);
      toast({
        title: "Error",
        description: "Failed to approve insight",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (insight: Insight) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('knowledge_insights')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewed_notes: reviewNotes || 'Not relevant'
        })
        .eq('id', insight.id);

      if (error) throw error;

      toast({
        title: "Insight rejected",
        description: "Insight has been marked as not relevant",
      });

      setSelectedInsight(null);
      setReviewNotes("");
      loadInsights();
    } catch (error) {
      console.error('Error rejecting insight:', error);
      toast({
        title: "Error",
        description: "Failed to reject insight",
        variant: "destructive",
      });
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'process_improvement': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'knowledge_gap': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'pattern_discovery': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'best_practice': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'workflow_optimization': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDepartmentIcon = (dept: string | null) => {
    if (!dept) return null;
    const department = DEPARTMENTS.find(d => d.value === dept);
    if (!department) return null;
    const Icon = department.icon;
    return <Icon className={`h-4 w-4 ${department.color}`} />;
  };

  const stats = {
    pending: insights.filter(i => i.status === 'new').length,
    approved: insights.filter(i => i.status === 'approved').length,
    rejected: insights.filter(i => i.status === 'rejected').length,
    highValue: insights.filter(i => i.confidence_score >= 0.8 && i.status === 'new').length
  };

  // Group by department for queue management
  const departmentQueues = DEPARTMENTS.map(dept => ({
    ...dept,
    count: insights.filter(i => i.department === dept.value && i.status === 'new').length,
    avgRelevance: insights
      .filter(i => i.department === dept.value && i.status === 'new')
      .reduce((sum, i) => sum + (i.relevance_score || 0), 0) / 
      Math.max(1, insights.filter(i => i.department === dept.value && i.status === 'new').length)
  }));

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8 space-y-6" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Insight Queue Management</h1>
            <p className="text-muted-foreground">Review and approve AI-generated insights by department</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                High Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highValue}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ≥80% confidence
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Published insights
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Not relevant
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Department Queue Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Department Queues</CardTitle>
            <CardDescription>
              Pending insights organized by department relevancy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {departmentQueues.map(dept => {
                const Icon = dept.icon;
                return (
                  <div
                    key={dept.value}
                    className="p-4 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setDepartmentFilter(dept.value);
                      setStatusFilter('new');
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`h-6 w-6 ${dept.color}`} />
                      <div>
                        <h3 className="font-semibold">{dept.label}</h3>
                        <p className="text-xs text-muted-foreground">
                          {dept.count} pending
                        </p>
                      </div>
                    </div>
                    {dept.count > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Avg Relevance</span>
                          <span className="font-medium">
                            {(dept.avgRelevance * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading insights...
              </CardContent>
            </Card>
          ) : filteredInsights.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No insights found matching your filters
              </CardContent>
            </Card>
          ) : (
            filteredInsights.map(insight => (
              <Card 
                key={insight.id} 
                className={`hover:border-primary/50 transition-colors ${
                  insight.confidence_score >= 0.8 ? 'border-l-4 border-l-amber-500' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getDepartmentIcon(insight.department)}
                        <h3 className="font-semibold text-lg">{insight.title}</h3>
                        {insight.confidence_score >= 0.8 && (
                          <Badge variant="default" className="bg-amber-500">
                            High Value
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <Badge className={getInsightTypeColor(insight.insight_type)}>
                          {insight.insight_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          Confidence: {(insight.confidence_score * 100).toFixed(0)}%
                        </Badge>
                        {insight.relevance_score && (
                          <Badge variant="outline">
                            Relevance: {(insight.relevance_score * 100).toFixed(0)}%
                          </Badge>
                        )}
                        {insight.department && (
                          <Badge variant="secondary">
                            {DEPARTMENTS.find(d => d.value === insight.department)?.label || insight.department}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(insight.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInsight(insight)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Review Dialog */}
      <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Insight</DialogTitle>
            <DialogDescription>
              Approve or reject this AI-generated insight
            </DialogDescription>
          </DialogHeader>
          {selectedInsight && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">{selectedInsight.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedInsight.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <Badge className={`ml-2 ${getInsightTypeColor(selectedInsight.insight_type)}`}>
                    {selectedInsight.insight_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="ml-2 font-medium">
                    {(selectedInsight.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Relevance:</span>
                  <span className="ml-2 font-medium">
                    {selectedInsight.relevance_score 
                      ? `${(selectedInsight.relevance_score * 100).toFixed(0)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Dept:</span>
                  <span className="ml-2 font-medium">
                    {selectedInsight.department || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign to Department</Label>
                <Select value={assignDepartment} onValueChange={setAssignDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  placeholder="Add notes about this insight..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selectedInsight && handleReject(selectedInsight)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => selectedInsight && handleApprove(selectedInsight)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
