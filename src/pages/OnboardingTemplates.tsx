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
import { Plus, FileText, Edit, Trash2, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";

interface Template {
  id: string;
  template_name: string;
  description: string | null;
  client_type: string;
  estimated_days: number | null;
  is_active: boolean;
  created_at: string;
}

export default function OnboardingTemplates() {
  const navigate = useNavigate();
  const toast = useStandardToast();
  const { customerId, isLoading: profileLoading } = useUserProfile();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    template_name: "",
    description: "",
    client_type: "standard",
    estimated_days: 30
  });

  useEffect(() => {
    if (!profileLoading) {
      loadTemplates();
    }
  }, [profileLoading]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .order('created_at', { ascending: false });

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
      if (!customerId) {
        toast.error("No customer profile found");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('onboarding_templates')
        .insert({
          ...formData,
          customer_id: customerId,
          created_by: user.id
        });

      if (error) throw error;

      toast.success("Template created successfully");

      setIsDialogOpen(false);
      setFormData({
        template_name: "",
        description: "",
        client_type: "standard",
        estimated_days: 30
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
        .from('onboarding_templates')
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

  const handleCreateEmployeeTemplate = async () => {
    try {
      if (!customerId) {
        toast.error("No customer profile found");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call the function to create employee onboarding template
      const { data, error } = await supabase
        .rpc('create_employee_onboarding_template', {
          _customer_id: customerId,
          _created_by: user.id
        });

      if (error) throw error;

      toast.success("Employee onboarding template created with 12 pre-configured tasks");

      await loadTemplates();
    } catch (error) {
      console.error('Error creating employee template:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create employee template");
    }
  };

  return (
    <DashboardLayout showDashboardNavigation={false}>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Onboarding Templates</h1>
            <p className="text-muted-foreground">Create and manage reusable client onboarding checklists for MSP customers</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/onboarding')}>
              Back to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCreateEmployeeTemplate}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Add Employee Template
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
                  <DialogTitle>Create Onboarding Template</DialogTitle>
                  <DialogDescription>
                    Create a reusable template for client onboarding
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_name">Template Name</Label>
                    <Input
                      id="template_name"
                      value={formData.template_name}
                      onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                      placeholder="e.g., Standard MSP Onboarding"
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
                    <Label htmlFor="client_type">Client Type</Label>
                    <Select
                      value={formData.client_type}
                      onValueChange={(value) => setFormData({ ...formData, client_type: value })}
                    >
                      <SelectTrigger id="client_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="smb">Small Business</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
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
            description="Create your first onboarding template or use our pre-built employee template"
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
                      <span className="text-muted-foreground">Client Type:</span>
                      <span className="font-medium capitalize">{template.client_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{template.estimated_days} days</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/onboarding/templates/${template.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
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
