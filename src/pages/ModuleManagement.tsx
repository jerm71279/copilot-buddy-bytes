import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Shield, Users, BarChart3, Database, FileText, Briefcase, Code, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface ModuleSettings {
  enabled_portals: string[];
  enabled_modules: Record<string, boolean>;
}

const portals = [
  { slug: "employee", label: "Employee Portal", icon: Users },
  { slug: "client", label: "Client Portal", icon: Briefcase },
  { slug: "admin", label: "Admin Portal", icon: Shield },
  { slug: "sales", label: "Sales Portal", icon: TrendingUp },
  { slug: "compliance", label: "Compliance Portal", icon: FileText },
  { slug: "analytics", label: "Analytics Portal", icon: BarChart3 },
  { slug: "data_flow", label: "Data Flow Portal", icon: Database },
];

const modules = [
  { slug: "it_services", label: "IT Services", icon: Code },
  { slug: "compliance_security", label: "Compliance & Security", icon: Shield },
  { slug: "operations", label: "Operations", icon: Database },
  { slug: "finance", label: "Finance", icon: TrendingUp },
  { slug: "hr", label: "Human Resources", icon: Users },
  { slug: "sales_marketing", label: "Sales & Marketing", icon: Briefcase },
  { slug: "engineering", label: "Engineering", icon: Code },
  { slug: "executive", label: "Executive", icon: BarChart3 },
];

const ModuleManagement = () => {
  const toast = useStandardToast();
  const { customerId } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ModuleSettings>({
    enabled_portals: portals.map(p => p.slug),
    enabled_modules: modules.reduce((acc, m) => ({ ...acc, [m.slug]: true }), {}),
  });

  useEffect(() => {
    if (customerId) {
      loadSettings();
    }
  }, [customerId]);

  const loadSettings = async () => {
    if (!customerId) return;

    try {
      setLoading(true);

      // Load customization settings
      const { data: customization } = await supabase
        .from("customer_customizations")
        .select("enabled_portals, enabled_modules")
        .eq("customer_id", customerId)
        .maybeSingle();

      if (customization) {
        const enabledPortals = customization.enabled_portals 
          ? (customization.enabled_portals as any[]).filter((p): p is string => typeof p === 'string')
          : portals.map(p => p.slug);
        
        const enabledModules = customization.enabled_modules && typeof customization.enabled_modules === 'object'
          ? customization.enabled_modules as Record<string, boolean>
          : modules.reduce((acc, m) => ({ ...acc, [m.slug]: true }), {});

        setSettings({
          enabled_portals: enabledPortals,
          enabled_modules: enabledModules,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.loadFailed("module settings");
    } finally {
      setLoading(false);
    }
  };

  const togglePortal = (slug: string) => {
    setSettings(prev => ({
      ...prev,
      enabled_portals: prev.enabled_portals.includes(slug)
        ? prev.enabled_portals.filter(p => p !== slug)
        : [...prev.enabled_portals, slug],
    }));
  };

  const toggleModule = (slug: string) => {
    setSettings(prev => ({
      ...prev,
      enabled_modules: {
        ...prev.enabled_modules,
        [slug]: !prev.enabled_modules[slug],
      },
    }));
  };

  const saveSettings = async () => {
    if (!customerId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("customer_customizations")
        .update({
          enabled_portals: settings.enabled_portals,
          enabled_modules: settings.enabled_modules,
        })
        .eq("customer_id", customerId);

      if (error) throw error;

      toast.success("Module settings saved successfully");
      
      // Reload the page to apply changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.saveFailed("module settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner message="Loading module settings..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold mb-2">Module Management</h1>
          <p className="text-muted-foreground">
            Enable or disable portals and modules for your organization
          </p>
        </header>

        <Alert role="alert">
          <AlertDescription>
            Changes will take effect after saving and refreshing the page. Disabled modules will be hidden from all users in your organization.
          </AlertDescription>
        </Alert>

        <section aria-labelledby="portal-access-title">
          <Card>
            <CardHeader>
              <CardTitle id="portal-access-title">Portal Access</CardTitle>
              <CardDescription>
                Control which main portals are accessible to your users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {portals.map((portal) => {
                const Icon = portal.icon;
                return (
                  <div 
                    key={portal.slug} 
                    className="flex items-center justify-between"
                    role="group"
                    aria-labelledby={`portal-label-${portal.slug}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <Label 
                        id={`portal-label-${portal.slug}`}
                        htmlFor={`portal-${portal.slug}`} 
                        className="cursor-pointer"
                      >
                        {portal.label}
                      </Label>
                    </div>
                    <Switch
                      id={`portal-${portal.slug}`}
                      checked={settings.enabled_portals.includes(portal.slug)}
                      onCheckedChange={() => togglePortal(portal.slug)}
                      aria-label={`Toggle ${portal.label}`}
                      aria-describedby={`portal-label-${portal.slug}`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="dashboard-modules-title">
          <Card>
            <CardHeader>
              <CardTitle id="dashboard-modules-title">Dashboard Modules</CardTitle>
              <CardDescription>
                Control which dashboard categories are visible in the navigation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <div 
                    key={module.slug} 
                    className="flex items-center justify-between"
                    role="group"
                    aria-labelledby={`module-label-${module.slug}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <Label 
                        id={`module-label-${module.slug}`}
                        htmlFor={`module-${module.slug}`} 
                        className="cursor-pointer"
                      >
                        {module.label}
                      </Label>
                    </div>
                    <Switch
                      id={`module-${module.slug}`}
                      checked={settings.enabled_modules[module.slug] ?? true}
                      onCheckedChange={() => toggleModule(module.slug)}
                      aria-label={`Toggle ${module.label}`}
                      aria-describedby={`module-label-${module.slug}`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <footer className="flex justify-end">
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            aria-label={saving ? "Saving settings..." : "Save module settings"}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                Save Settings
              </>
            )}
          </Button>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default ModuleManagement;
