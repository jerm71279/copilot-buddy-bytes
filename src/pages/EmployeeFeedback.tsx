import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/services/authService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, TrendingUp, Bug, Lightbulb, Shield, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";

const EmployeeFeedback = () => {
  const toast = useStandardToast();
  useUserProfile();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    feedback_type: "general",
    category: "",
    priority: "medium",
    title: "",
    description: "",
    affected_module: "",
    steps_to_reproduce: "",
    expected_behavior: "",
    actual_behavior: "",
  });

  const { data: feedback, isLoading } = useQuery({
    queryKey: ["employee-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_feedback")
        .select("*")
        .order("submitted_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("employee_feedback")
        .insert({
          ...data,
          submitted_by: user.id,
          customer_id: "00000000-0000-0000-0000-000000000000", // Will be set by trigger
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.created("Feedback");
      queryClient.invalidateQueries({ queryKey: ["employee-feedback"] });
      setIsDialogOpen(false);
      setFormData({
        feedback_type: "general",
        category: "",
        priority: "medium",
        title: "",
        description: "",
        affected_module: "",
        steps_to_reproduce: "",
        expected_behavior: "",
        actual_behavior: "",
      });
    },
    onError: () => {
      toast.saveFailed("feedback");
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const item = feedback?.find(f => f.id === feedbackId);
      if (!item) return;

      const { error } = await supabase
        .from("employee_feedback")
        .update({ upvotes: (item.upvotes || 0) + 1 })
        .eq("id", feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-feedback"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFeedbackMutation.mutate(formData);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug": return <Bug className="w-4 h-4" />;
      case "feature_request": return <Lightbulb className="w-4 h-4" />;
      case "security": return <Shield className="w-4 h-4" />;
      case "usability": return <TrendingUp className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-primary";
      case "in_progress": return "bg-secondary";
      case "acknowledged": return "bg-warning";
      case "new": return "bg-accent";
      default: return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading feedback...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Employee Feedback</h1>
            <p className="text-muted-foreground">
              Share your insights to help improve the platform
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Submit Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Feedback</DialogTitle>
                <DialogDescription>
                  Help us improve the platform by sharing your feedback
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedback_type">Type</Label>
                    <Select
                      value={formData.feedback_type}
                      onValueChange={(value) => setFormData({ ...formData, feedback_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="usability">Usability Issue</SelectItem>
                        <SelectItem value="performance">Performance Issue</SelectItem>
                        <SelectItem value="security">Security Concern</SelectItem>
                        <SelectItem value="training">Training Feedback</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="general">General Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Dashboard, Reports, Settings"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of the issue or suggestion"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of your feedback"
                    rows={4}
                    required
                  />
                </div>

                {formData.feedback_type === "bug" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="steps">Steps to Reproduce</Label>
                      <Textarea
                        id="steps"
                        value={formData.steps_to_reproduce}
                        onChange={(e) => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
                        placeholder="1. Go to...\n2. Click on...\n3. See error"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expected">Expected Behavior</Label>
                        <Textarea
                          id="expected"
                          value={formData.expected_behavior}
                          onChange={(e) => setFormData({ ...formData, expected_behavior: e.target.value })}
                          placeholder="What should happen"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="actual">Actual Behavior</Label>
                        <Textarea
                          id="actual"
                          value={formData.actual_behavior}
                          onChange={(e) => setFormData({ ...formData, actual_behavior: e.target.value })}
                          placeholder="What actually happens"
                          rows={2}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="affected_module">Affected Module (Optional)</Label>
                  <Input
                    id="affected_module"
                    value={formData.affected_module}
                    onChange={(e) => setFormData({ ...formData, affected_module: e.target.value })}
                    placeholder="e.g., CMDB, Workflow Builder"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFeedbackMutation.isPending}>
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Feedback</TabsTrigger>
            <TabsTrigger value="my">My Submissions</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {feedback?.map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(item.feedback_type)}
                        {item.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {item.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace("_", " ")}
                      </Badge>
                      <Badge variant={getPriorityColor(item.priority) as any}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4 text-muted-foreground">
                      <span>Category: {item.category}</span>
                      <span>•</span>
                      <span>Submitted: {new Date(item.submitted_at).toLocaleDateString()}</span>
                      {item.assigned_to && (
                        <>
                          <span>•</span>
                          <span>Assigned to: {item.assigned_to}</span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => upvoteMutation.mutate(item.id)}
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {item.upvotes || 0}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            {feedback?.filter(item => item.submitted_by === item.submitted_by).map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(item.feedback_type)}
                        {item.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {item.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace("_", " ")}
                      </Badge>
                      <Badge variant={getPriorityColor(item.priority) as any}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            {feedback?.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 10).map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(item.feedback_type)}
                        {item.title}
                        <Badge variant="secondary">{item.upvotes || 0} upvotes</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeFeedback;