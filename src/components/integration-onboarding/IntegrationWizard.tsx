import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateIntegration, useInitializeChecklist } from '@/hooks/useIntegrationOnboarding';
import { Integration } from '@/services/integrationOnboardingService';

interface IntegrationWizardProps {
  open: boolean;
  onClose: () => void;
}

export function IntegrationWizard({ open, onClose }: IntegrationWizardProps) {
  const [formData, setFormData] = useState<Partial<Integration>>({
    integration_name: '',
    system_type: '',
    vendor_name: '',
    connection_method: '',
    auth_method: '',
    base_url: '',
    api_version: '',
    documentation_url: '',
    notes: '',
    status: 'planning',
  });

  const createIntegration = useCreateIntegration();
  const initializeChecklist = useInitializeChecklist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const integration = await createIntegration.mutateAsync(formData);
      if (integration) {
        await initializeChecklist.mutateAsync(integration.id);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create integration:', error);
    }
  };

  const updateField = (field: keyof Integration, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Integration Onboarding</DialogTitle>
          <DialogDescription>
            Create a new integration and initialize the onboarding checklist
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Integration Name */}
            <div>
              <Label htmlFor="integration_name">Integration Name *</Label>
              <Input
                id="integration_name"
                value={formData.integration_name}
                onChange={(e) => updateField('integration_name', e.target.value)}
                placeholder="e.g., Microsoft 365, Salesforce"
                required
              />
            </div>

            {/* Vendor Name */}
            <div>
              <Label htmlFor="vendor_name">Vendor Name *</Label>
              <Input
                id="vendor_name"
                value={formData.vendor_name}
                onChange={(e) => updateField('vendor_name', e.target.value)}
                placeholder="e.g., Microsoft, Salesforce"
                required
              />
            </div>

            {/* System Type */}
            <div>
              <Label htmlFor="system_type">System Type *</Label>
              <Select
                value={formData.system_type}
                onValueChange={(value) => updateField('system_type', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select system type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS Platform</SelectItem>
                  <SelectItem value="on-prem">On-Premises Server</SelectItem>
                  <SelectItem value="network">Network Device</SelectItem>
                  <SelectItem value="api">API Service</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="storage">Storage System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Connection Method */}
            <div>
              <Label htmlFor="connection_method">Connection Method *</Label>
              <Select
                value={formData.connection_method}
                onValueChange={(value) => updateField('connection_method', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connection method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rest_api">REST API</SelectItem>
                  <SelectItem value="graphql">GraphQL</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="powershell">PowerShell/CLI</SelectItem>
                  <SelectItem value="snmp">SNMP</SelectItem>
                  <SelectItem value="syslog">Syslog</SelectItem>
                  <SelectItem value="direct_db">Direct Database</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Authentication Method */}
            <div>
              <Label htmlFor="auth_method">Authentication Method *</Label>
              <Select
                value={formData.auth_method}
                onValueChange={(value) => updateField('auth_method', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  <SelectItem value="oauth1">OAuth 1.0</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer_token">Bearer Token</SelectItem>
                  <SelectItem value="service_account">Service Account</SelectItem>
                  <SelectItem value="basic_auth">Basic Auth</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Base URL */}
            <div>
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                type="url"
                value={formData.base_url}
                onChange={(e) => updateField('base_url', e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>

            {/* API Version */}
            <div>
              <Label htmlFor="api_version">API Version</Label>
              <Input
                id="api_version"
                value={formData.api_version}
                onChange={(e) => updateField('api_version', e.target.value)}
                placeholder="v1, v2, 2023-01-01"
              />
            </div>

            {/* Documentation URL */}
            <div>
              <Label htmlFor="documentation_url">Documentation URL</Label>
              <Input
                id="documentation_url"
                type="url"
                value={formData.documentation_url}
                onChange={(e) => updateField('documentation_url', e.target.value)}
                placeholder="https://docs.example.com"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Additional notes about this integration"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createIntegration.isPending}
            >
              {createIntegration.isPending ? 'Creating...' : 'Create Integration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
