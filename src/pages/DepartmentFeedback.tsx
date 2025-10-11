import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertTriangle, Info, Lightbulb, ArrowLeft } from "lucide-react";

interface FeedbackItem {
  id: string;
  department: string;
  feedback_type: string;
  feedback_content: string;
  priority: string;
  acknowledged: boolean;
  applied: boolean;
  application_notes: string | null;
  created_at: string;
  global_insights?: {
    insight_type: string;
    title: string;
    description: string;
    confidence_score: number;
    affected_departments: string[];
    recommended_actions: any; // Changed from string[] to any to handle Json type
  };
}

const DepartmentFeedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);
  const [applicationNotes, setApplicationNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('insight_feedback')
        .select(`
          *,
          global_insights (
            insight_type,
            title,
            description,
            confidence_score,
            affected_departments,
            recommended_actions
          )
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedback(data || []);
      
      // Extract unique departments
      const depts = Array.from(new Set(data?.map(f => f.department) || []));
      setDepartments(depts);
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('insight_feedback')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', feedbackId);

      if (error) throw error;

      toast({
        title: "Acknowledged",
        description: "Feedback has been marked as acknowledged",
      });

      fetchFeedback();
    } catch (error: any) {
      console.error('Error acknowledging feedback:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge feedback",
        variant: "destructive",
      });
    }
  };

  const applyFeedback = async (feedbackId: string) => {
    try {
      const notes = applicationNotes[feedbackId] || '';
      
      const { error } = await supabase
        .from('insight_feedback')
        .update({
          applied: true,
          application_notes: notes,
        })
        .eq('id', feedbackId);

      if (error) throw error;

      toast({
        title: "Applied",
        description: "Feedback has been marked as applied",
      });

      setApplicationNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[feedbackId];
        return newNotes;
      });

      fetchFeedback();
    } catch (error: any) {
      console.error('Error applying feedback:', error);
      toast({
        title: "Error",
        description: "Failed to apply feedback",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'best_practice': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const filteredFeedback = selectedDept === "all" 
    ? feedback 
    : feedback.filter(f => f.department === selectedDept);

  const stats = {
    total: feedback.length,
    acknowledged: feedback.filter(f => f.acknowledged).length,
    applied: feedback.filter(f => f.applied).length,
    pending: feedback.filter(f => !f.acknowledged && !f.applied).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Department Feedback</h1>
          <p className="text-muted-foreground">
            Organization-wide insights and recommendations from the Central MML Engine
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.acknowledged}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.applied}</div>
          </CardContent>
        </Card>
      </div>

      {/* Department Filter */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={selectedDept === "all" ? "default" : "outline"}
          onClick={() => setSelectedDept("all")}
        >
          All Departments
        </Button>
        {departments.map(dept => (
          <Button
            key={dept}
            variant={selectedDept === dept ? "default" : "outline"}
            onClick={() => setSelectedDept(dept)}
          >
            {dept}
          </Button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No feedback items found
            </CardContent>
          </Card>
        ) : (
          filteredFeedback.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.feedback_type)}
                    <div>
                      <CardTitle className="text-lg">
                        {item.feedback_type.replace('_', ' ').toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        Department: {item.department}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                    {item.acknowledged && (
                      <Badge variant="outline" className="bg-blue-50">
                        Acknowledged
                      </Badge>
                    )}
                    {item.applied && (
                      <Badge variant="outline" className="bg-green-50">
                        Applied
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{item.feedback_content}</p>

                {item.global_insights && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-sm">Related Global Insight:</p>
                    <p className="text-sm font-medium">{item.global_insights.title}</p>
                    <p className="text-sm text-muted-foreground">{item.global_insights.description}</p>
                    {item.global_insights.recommended_actions && item.global_insights.recommended_actions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Recommended Actions:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {item.global_insights.recommended_actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Badge variant="outline">
                      Confidence: {Math.round((item.global_insights.confidence_score || 0) * 100)}%
                    </Badge>
                  </div>
                )}

                {item.application_notes && (
                  <div className="bg-green-50 p-3 rounded text-sm">
                    <p className="font-medium mb-1">Application Notes:</p>
                    <p>{item.application_notes}</p>
                  </div>
                )}

                {!item.applied && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add notes about how this feedback was applied..."
                      value={applicationNotes[item.id] || ''}
                      onChange={(e) => setApplicationNotes(prev => ({
                        ...prev,
                        [item.id]: e.target.value
                      }))}
                    />
                    <div className="flex gap-2">
                      {!item.acknowledged && (
                        <Button
                          variant="outline"
                          onClick={() => acknowledgeFeedback(item.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        onClick={() => applyFeedback(item.id)}
                      >
                        Mark as Applied
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DepartmentFeedback;
