import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

const DevSettings = () => {
  const [bypassAuth, setBypassAuth] = useState(
    localStorage.getItem('bypassAuth') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('bypassAuth', bypassAuth.toString());
  }, [bypassAuth]);

  const handleToggle = (checked: boolean) => {
    setBypassAuth(checked);
    toast.success(
      checked 
        ? "Authentication bypass enabled - Page will reload" 
        : "Authentication bypass disabled - Page will reload"
    );
    
    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Development Settings</h1>
        <p className="text-muted-foreground">
          Configure development and testing options
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> These settings are for development and testing only. 
          Do not use in production environments.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Settings
          </CardTitle>
          <CardDescription>
            Control authentication behavior for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bypass-auth" className="text-base">
                Bypass Authentication
              </Label>
              <p className="text-sm text-muted-foreground">
                Skip login requirements and access all pages directly
              </p>
            </div>
            <Switch
              id="bypass-auth"
              checked={bypassAuth}
              onCheckedChange={handleToggle}
            />
          </div>

          {bypassAuth && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Authentication is currently bypassed.</strong> All protected routes 
                are accessible without login. Turn this off before deploying to production.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Enable Bypass:</strong>
            <p className="text-muted-foreground">
              Turn on the switch above. The page will reload and you'll have access to all 
              routes without needing to log in.
            </p>
          </div>
          <div>
            <strong>Disable Bypass:</strong>
            <p className="text-muted-foreground">
              Turn off the switch to restore normal authentication. The page will reload 
              and require login for protected routes.
            </p>
          </div>
          <div>
            <strong>Current Status:</strong>
            <p className={bypassAuth ? "text-orange-600" : "text-green-600"}>
              {bypassAuth ? "⚠️ Authentication is BYPASSED" : "✓ Authentication is ACTIVE"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevSettings;
