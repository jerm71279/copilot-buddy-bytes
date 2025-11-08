import { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIntegrations, useIntegrationStats } from '@/hooks/useIntegrationOnboarding';
import { IntegrationCard } from '@/components/integration-onboarding/IntegrationCard';
import { IntegrationWizard } from '@/components/integration-onboarding/IntegrationWizard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function IntegrationOnboarding() {
  const [showWizard, setShowWizard] = useState(false);
  const { data: integrations, isLoading, error } = useIntegrations();
  const { data: stats } = useIntegrationStats();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load integrations. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Integration Onboarding</h1>
          <p className="text-muted-foreground mt-2">
            Manage and onboard system integrations with structured workflows
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Integration
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Integrations</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats?.active || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Planning</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{stats?.planning || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Healthy</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats?.healthy || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Integration List */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            View and manage all system integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations && integrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No integrations found</p>
              <Button onClick={() => setShowWizard(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Integration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Integration Onboarding Guide</CardTitle>
          <CardDescription>
            Learn how to onboard new integrations with our comprehensive guide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/INTEGRATION_ONBOARDING_GUIDE.md" target="_blank">
              View Documentation
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Integration Wizard Dialog */}
      {showWizard && (
        <IntegrationWizard
          open={showWizard}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
