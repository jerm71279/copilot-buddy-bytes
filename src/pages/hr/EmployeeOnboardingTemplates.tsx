import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStandardToast } from "@/hooks/useStandardToast";
import { useRequireAuth } from "@/hooks/useAuth";
import { Plus, FileText, Edit, Trash2, Users, UserPlus } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface Template {
  id: string;
  template_name: string;
  description: string | null;
  department_type: string;
  estimated_days: number | null;
  is_active: boolean;
  created_at: string;
}

export default function EmployeeOnboardingTemplates() {
  const navigate = useNavigate();
  const toast = useStandardToast();
  const { checkSessionAndLoad } = useRequireAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    template_name: "",
    description: "",
    department_type: "general",
    estimated_days: 7
  });

  useEffect(() => {
    checkSessionAndLoad(loadTemplates);
  }, []);

  const loadTemplates = async () => {
    try {
      // Get current user's customer_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) {
        toast.error("Please complete your profile setup first.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('employee_onboarding_templates')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('created_at', { ascending: false});

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) throw new Error("No customer profile found");

      const { error } = await supabase
        .from('employee_onboarding_templates')
        .insert({
          ...formData,
          customer_id: profile.customer_id,
          created_by: user.id
        });

      if (error) throw error;

      toast.success("Template created successfully");

      setIsDialogOpen(false);
      setFormData({
        template_name: "",
        description: "",
        department_type: "general",
        estimated_days: 7
      });
      await loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error("Failed to create template");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from('employee_onboarding_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Template deleted successfully");

      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error("Failed to delete template");
    }
  };

  const handleCreateStandardTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.customer_id) throw new Error("No customer profile found");

      const { data, error } = await supabase
        .rpc('create_employee_onboarding_template', {
          _customer_id: profile.customer_id,
          _created_by: user.id
        });

      if (error) throw error;

      toast.success("Standard employee onboarding template created with 12 pre-configured tasks");

      await loadTemplates();
    } catch (error) {
      console.error('Error creating standard template:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create standard template");
    }
  };

  return (
    <DashboardLayout>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Employee Onboarding Templates</h1>
            <p className="text-muted-foreground">Create and manage reusable employee onboarding checklists</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/hr/employee-onboarding')}>
              Back to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCreateStandardTemplate}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Add Standard Template
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Employee Onboarding Template</DialogTitle>
                  <DialogDescription>
                    Create a reusable template for employee onboarding
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_name">Template Name</Label>
                    <Input
                      id="template_name"
                      value={formData.template_name}
                      onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                      placeholder="e.g., IT Department Onboarding"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department_type">Department Type</Label>
                    <Select
                      value={formData.department_type}
                      onValueChange={(value) => setFormData({ ...formData, department_type: value })}
                    >
                      <SelectTrigger id="department_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="it">IT</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_days">Estimated Days</Label>
                    <Input
                      id="estimated_days"
                      type="number"
                      value={formData.estimated_days}
                      onChange={(e) => setFormData({ ...formData, estimated_days: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading templates..." />
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Create your first template or use our pre-built standard template"
            action={{
              label: "New Custom Template",
              onClick: () => setIsDialogOpen(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {template.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium capitalize">{template.department_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{template.estimated_days} days</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/hr/employee-onboarding/new?template=${template.id}`)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Template editing will be available in a future update");
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </DashboardLayout>
  );
}
