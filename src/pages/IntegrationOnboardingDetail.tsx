import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntegration, useOnboardingChecklist } from '@/hooks/useIntegrationOnboarding';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OnboardingProgress } from '@/components/integration-onboarding/OnboardingProgress';
import { ChecklistTable } from '@/components/integration-onboarding/ChecklistTable';

export default function IntegrationOnboardingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: integration, isLoading, error } = useIntegration(id!);
  const { data: checklist } = useOnboardingChecklist(id!);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !integration) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load integration details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const completedSteps = checklist?.filter(item => item.status === 'completed').length || 0;
  const totalSteps = checklist?.length || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/integration-onboarding')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-foreground">{integration.integration_name}</h1>
          <p className="text-muted-foreground mt-2">{integration.vendor_name}</p>
        </div>
        <Badge>{integration.status}</Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health Status
            </CardDescription>
            <CardTitle className="text-2xl capitalize">{integration.health_status}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Onboarding Progress
            </CardDescription>
            <CardTitle className="text-2xl">{progress}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Type</CardDescription>
            <CardTitle className="text-2xl capitalize">{integration.system_type}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Progress Visualization */}
      <OnboardingProgress checklist={checklist || []} />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Onboarding Checklist</TabsTrigger>
          <TabsTrigger value="technical">Technical Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Connection Method</p>
                  <p className="font-medium">{integration.connection_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Authentication</p>
                  <p className="font-medium">{integration.auth_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">API Version</p>
                  <p className="font-medium">{integration.api_version || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Edge Function</p>
                  <p className="font-medium">{integration.edge_function_name || 'Not configured'}</p>
                </div>
              </div>

              {integration.documentation_url && (
                <div className="pt-4">
                  <Button variant="outline" asChild>
                    <a href={integration.documentation_url} target="_blank" rel="noopener noreferrer">
                      View Documentation
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}

              {integration.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{integration.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <ChecklistTable checklist={checklist || []} integrationId={id!} />
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Base URL</p>
                <p className="font-mono text-sm">{integration.base_url || 'Not configured'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credential Vault Path</p>
                <p className="font-mono text-sm">{integration.credential_vault_path || 'Not configured'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rate Limit (per minute)</p>
                  <p className="font-medium">{integration.rate_limit_per_minute || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate Limit (per day)</p>
                  <p className="font-medium">{integration.rate_limit_per_day || 'Not set'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Credential Rotation</p>
                <p className="font-medium">
                  {integration.last_credential_rotation
                    ? new Date(integration.last_credential_rotation).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rotation Schedule</p>
                <p className="font-medium">{integration.credential_rotation_schedule || 'Not configured'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
