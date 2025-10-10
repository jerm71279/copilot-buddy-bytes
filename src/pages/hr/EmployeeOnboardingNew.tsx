import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
import DashboardNavigation from "@/components/DashboardNavigation";

interface Template {
  id: string;
  template_name: string;
  description: string | null;
  department_type: string;
  estimated_days: number | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

export default function EmployeeOnboardingNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedTemplateId = searchParams.get('template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: "",
    employee_email: "",
    employee_phone: "",
    template_id: preselectedTemplateId || "",
    department: "",
    job_title: "",
    employment_type: "full-time",
    start_date: new Date().toISOString().split('T')[0],
    assigned_role_id: "",
    notes: "",
  });

  const selectedTemplate = templates.find(t => t.id === formData.template_id);

  useEffect(() => {
    loadTemplates();
    loadRoles();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_onboarding_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_name || !formData.employee_email || !formData.template_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.customer_id) throw new Error("No customer profile found");

      const { data: onboarding, error: onboardingError } = await supabase
        .from('employee_onboardings')
        .insert({
          customer_id: profile.customer_id,
          template_id: formData.template_id,
          employee_name: formData.employee_name,
          employee_email: formData.employee_email,
          employee_phone: formData.employee_phone || null,
          department: formData.department || null,
          job_title: formData.job_title || null,
          employment_type: formData.employment_type,
          start_date: formData.start_date,
          assigned_role_id: formData.assigned_role_id || null,
          notes: formData.notes || null,
          status: 'not_started',
          completion_percentage: 0,
          created_by: user.id
        })
        .select()
        .single();

      if (onboardingError) throw onboardingError;

      toast({
        title: "Success",
        description: "Employee onboarding created successfully"
      });

      navigate(`/hr/employee-onboarding/${onboarding.id}`);
    } catch (error) {
      console.error('Error creating onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to create employee onboarding",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-8" style={{ paddingTop: 'calc(var(--lanes-height, 200px) + 1rem)' }}>
        <DashboardNavigation 
          title="New Employee Onboarding"
          dashboards={[
            { name: "Employee Onboarding", path: "/hr/employee-onboarding" },
            { name: "Templates", path: "/hr/employee-onboarding/templates" },
          ]}
        />

        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/hr/employee-onboarding')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Create New Employee Onboarding</h1>
          <p className="text-muted-foreground">Set up onboarding for a new employee</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>Enter the new employee's details and select an onboarding template</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_name">Employee Name *</Label>
                  <Input
                    id="employee_name"
                    value={formData.employee_name}
                    onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_email">Email Address *</Label>
                  <Input
                    id="employee_email"
                    type="email"
                    value={formData.employee_email}
                    onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })}
                    placeholder="employee@company.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_phone">Phone Number</Label>
                  <Input
                    id="employee_phone"
                    type="tel"
                    value={formData.employee_phone}
                    onChange={(e) => setFormData({ ...formData, employee_phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Onboarding Template *</Label>
                  {preselectedTemplateId ? (
                    <>
                      <Input
                        id="template"
                        value={selectedTemplate?.template_name || 'Loading template...'}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-sm text-muted-foreground">
                        This template was pre-selected and cannot be changed
                      </p>
                    </>
                  ) : (
                    <Select
                      value={formData.template_id}
                      onValueChange={(value) => setFormData({ ...formData, template_id: value })}
                    >
                      <SelectTrigger id="template" className="bg-background">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {templates.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No templates available</div>
                        ) : (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.template_name}
                              {template.estimated_days && ` (${template.estimated_days} days)`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder="e.g., Senior Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-Time</SelectItem>
                      <SelectItem value="part-time">Part-Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_role_id">RBAC Role</Label>
                  <Select
                    value={formData.assigned_role_id}
                    onValueChange={(value) => setFormData({ ...formData, assigned_role_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this employee onboarding"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/hr/employee-onboarding')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isLoading ? "Creating..." : "Create Onboarding"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
