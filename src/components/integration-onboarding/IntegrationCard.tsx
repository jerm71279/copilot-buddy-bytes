import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Activity, AlertCircle } from 'lucide-react';
import { Integration } from '@/services/integrationOnboardingService';
import { useNavigate } from 'react-router-dom';

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'planning':
        return 'secondary';
      case 'development':
        return 'outline';
      case 'testing':
        return 'outline';
      case 'deprecated':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/integration-onboarding/${integration.id}`)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{integration.integration_name}</CardTitle>
            <CardDescription className="mt-1">{integration.vendor_name}</CardDescription>
          </div>
          {getHealthIcon(integration.health_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(integration.status)}>
            {integration.status}
          </Badge>
          <Badge variant="outline">{integration.system_type}</Badge>
        </div>

        <div className="text-sm text-muted-foreground">
          <div>Method: {integration.connection_method}</div>
          <div>Auth: {integration.auth_method}</div>
        </div>

        <Button variant="ghost" className="w-full" onClick={() => navigate(`/integration-onboarding/${integration.id}`)}>
          View Details
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
