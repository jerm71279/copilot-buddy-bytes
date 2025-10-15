import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingUp, Users, Cloud, Brain, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LovableCostCalculator = () => {
  // User inputs
  const [lovableSeats, setLovableSeats] = useState(5);
  
  // App profile selection
  const [appType, setAppType] = useState<'personal' | 'small-business' | 'team-project' | 'ecommerce' | 'custom'>('team-project');
  
  // Custom usage estimates (only shown for 'custom')
  const [cloudEstimate, setCloudEstimate] = useState(15);
  const [aiEstimate, setAiEstimate] = useState(5);

  // Pricing constants
  const LOVABLE_PRICING = {
    free: 0,
    pro: 20,
    team: 40,
    enterprise: 0 // Custom pricing - contact sales
  };

  const CLOUD_FREE_TIER = 25;
  const AI_FREE_TIER = 1;

  // App profile examples from Lovable docs (updated Dec 2024)
  const APP_PROFILES = {
    'personal': {
      name: 'Personal Blog/Portfolio',
      description: '500 visits/month, posts/comments, some images',
      cloudCost: 1,
      aiCost: 1,
      details: 'AI: 2,500 calls/month for summaries or catchy titles',
      visits: '500'
    },
    'small-business': {
      name: 'Small Business Website',
      description: '5,000 visits/month, product listings, forms, images',
      cloudCost: 5,
      aiCost: 2,
      details: 'AI: 6,500 calls/month for simple chat assistant',
      visits: '5,000'
    },
    'team-project': {
      name: 'Team Project Manager',
      description: '20 active users, 10,000 visits, tasks, file uploads',
      cloudCost: 15,
      aiCost: 5,
      details: 'AI: 6,000 calls/month for task suggestions & summaries',
      visits: '10,000'
    },
    'ecommerce': {
      name: 'E-commerce Store',
      description: '10,000 visitors, 500 purchases/month, many images',
      cloudCost: 65,
      aiCost: 10,
      details: 'AI: 20,000 calls/month for product descriptions & shopping assistant',
      visits: '10,000'
    },
    'custom': {
      name: 'Custom Configuration',
      description: 'Set your own usage estimates',
      cloudCost: 15,
      aiCost: 5,
      details: 'Based on your actual usage in Settings → Usage',
      visits: 'Variable'
    }
  };

  // Calculate costs for a given tier
  const selectedProfile = APP_PROFILES[appType];
  const rawCloudCost = appType === 'custom' ? cloudEstimate : selectedProfile.cloudCost;
  const rawAICost = appType === 'custom' ? aiEstimate : selectedProfile.aiCost;
  
  const effectiveCloudCost = Math.max(0, rawCloudCost - CLOUD_FREE_TIER);
  const effectiveAICost = Math.max(0, rawAICost - AI_FREE_TIER);
  
  const calculateTierCost = (tier: 'free' | 'pro' | 'team' | 'enterprise') => {
    const subscriptionCost = tier === 'enterprise' ? 0 : lovableSeats * LOVABLE_PRICING[tier];
    return {
      subscription: subscriptionCost,
      cloud: effectiveCloudCost,
      ai: effectiveAICost,
      total: subscriptionCost + effectiveCloudCost + effectiveAICost
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Lovable Cost Calculator</h1>
        <p className="text-muted-foreground">
          Compare subscription models and estimate your monthly Lovable costs
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Lovable uses usage-based pricing for Cloud and AI. These are estimates based on example app profiles from official documentation. 
          For accurate costs, check your actual usage in Settings → Workspace → Usage.
          <div className="mt-2 flex gap-2">
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <a href="https://docs.lovable.dev/features/cloud#usage-based-cloud-and-ai-pricing" target="_blank" rel="noopener noreferrer">
                Cloud Pricing Docs <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <span className="text-muted-foreground">•</span>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <a href="https://docs.lovable.dev/features/ai#usage-and-pricing" target="_blank" rel="noopener noreferrer">
                AI Pricing Docs <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Configuration Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Team Size */}
        <Card>
          <CardHeader>
            <CardTitle>Team Size</CardTitle>
            <CardDescription>Number of Lovable seats needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Lovable Team Seats: {lovableSeats}</Label>
            <Slider
              value={[lovableSeats]}
              onValueChange={(v) => setLovableSeats(v[0])}
              min={1}
              max={10}
              step={1}
            />
          </CardContent>
        </Card>

        {/* App Profile Selection */}
        <Card>
          <CardHeader>
            <CardTitle>App Profile & Usage</CardTitle>
            <CardDescription>Select the profile that best matches your app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>App Type</Label>
              <Select value={appType} onValueChange={(v: any) => setAppType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APP_PROFILES).map(([key, profile]) => (
                    <SelectItem key={key} value={key}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">{selectedProfile.name}</p>
              <p className="text-xs text-muted-foreground">{selectedProfile.description}</p>
              <p className="text-xs text-muted-foreground">{selectedProfile.details}</p>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Visits</p>
                  <p className="text-sm font-medium">{selectedProfile.visits}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Est. Cloud Cost</p>
                  <p className="text-sm font-medium">${selectedProfile.cloudCost}/mo</p>
                </div>
              </div>
            </div>

            {appType === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Estimated Cloud Cost ($/month)</Label>
                  <Input
                    type="number"
                    value={cloudEstimate}
                    onChange={(e) => setCloudEstimate(Number(e.target.value))}
                    min={0}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Check Settings → Usage for your actual Cloud costs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Estimated AI Cost ($/month)</Label>
                  <Input
                    type="number"
                    value={aiEstimate}
                    onChange={(e) => setAiEstimate(Number(e.target.value))}
                    min={0}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Check Settings → Usage for your actual AI costs
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription Model Comparison */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Subscription Models Comparison</h2>
        <p className="text-muted-foreground mb-6">
          Monthly cost breakdown for each subscription tier (based on {lovableSeats} seat{lovableSeats > 1 ? 's' : ''})
        </p>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Free Plan</span>
                <Badge variant="outline">$0/month</Badge>
              </CardTitle>
              <CardDescription>Limited features, great for testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Subscription ({lovableSeats} seat{lovableSeats > 1 ? 's' : ''})</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Cloud (before free tier)</span>
                  <span>${rawCloudCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Free tier discount</span>
                  <span>-${Math.min(CLOUD_FREE_TIER, rawCloudCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cloud (after free tier)</span>
                  <span className="font-medium">${effectiveCloudCost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>AI (before free tier)</span>
                  <span>${rawAICost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Free tier discount</span>
                  <span>-${Math.min(AI_FREE_TIER, rawAICost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI (after free tier)</span>
                  <span className="font-medium">${effectiveAICost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Monthly</span>
                  <span className="text-primary">${calculateTierCost('free').total.toFixed(2)}</span>
                </div>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Must upgrade to add funds beyond free tier
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pro Plan</span>
                <Badge variant="outline">${calculateTierCost('pro').total.toFixed(2)}/month</Badge>
              </CardTitle>
              <CardDescription>$20/seat - Enhanced features for professionals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Subscription ({lovableSeats} seat{lovableSeats > 1 ? 's' : ''})</span>
                  <span className="font-medium">${calculateTierCost('pro').subscription.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Cloud (before free tier)</span>
                  <span>${rawCloudCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Free tier discount</span>
                  <span>-${Math.min(CLOUD_FREE_TIER, rawCloudCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cloud (after free tier)</span>
                  <span className="font-medium">${effectiveCloudCost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>AI (before free tier)</span>
                  <span>${rawAICost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Free tier discount</span>
                  <span>-${Math.min(AI_FREE_TIER, rawAICost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI (after free tier)</span>
                  <span className="font-medium">${effectiveAICost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Monthly</span>
                  <span className="text-primary">${calculateTierCost('pro').total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Annual (if paid yearly)</span>
                  <span>${(calculateTierCost('pro').total * 12).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Team Plan</span>
                <Badge variant="outline">${calculateTierCost('team').total.toFixed(2)}/month</Badge>
              </CardTitle>
              <CardDescription>$40/seat - Advanced collaboration features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Subscription ({lovableSeats} seat{lovableSeats > 1 ? 's' : ''})</span>
                  <span className="font-medium">${calculateTierCost('team').subscription.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Cloud (before free tier)</span>
                  <span>${rawCloudCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Free tier discount</span>
                  <span>-${Math.min(CLOUD_FREE_TIER, rawCloudCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cloud (after free tier)</span>
                  <span className="font-medium">${effectiveCloudCost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>AI (before free tier)</span>
                  <span>${rawAICost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Free tier discount</span>
                  <span>-${Math.min(AI_FREE_TIER, rawAICost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI (after free tier)</span>
                  <span className="font-medium">${effectiveAICost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Monthly</span>
                  <span className="text-primary">${calculateTierCost('team').total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Annual (if paid yearly)</span>
                  <span>${(calculateTierCost('team').total * 12).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Enterprise Plan</span>
                <Badge variant="outline">Custom</Badge>
              </CardTitle>
              <CardDescription>Custom pricing - Contact sales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Custom Pricing:</strong> Contact{' '}
                  <a href="mailto:sales@lovable.dev" className="underline">sales@lovable.dev</a> for enterprise quote.
                  Below shows Cloud + AI costs only.
                </AlertDescription>
              </Alert>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Subscription</span>
                  <span className="font-medium">Contact Sales</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Cloud (before free tier)</span>
                  <span>${rawCloudCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Free tier discount</span>
                  <span>-${Math.min(CLOUD_FREE_TIER, rawCloudCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cloud (after free tier)</span>
                  <span className="font-medium">${effectiveCloudCost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>AI (before free tier)</span>
                  <span>${rawAICost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Free tier discount</span>
                  <span>-${Math.min(AI_FREE_TIER, rawAICost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI (after free tier)</span>
                  <span className="font-medium">${effectiveAICost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Cloud + AI Monthly</span>
                  <span className="text-primary">${(effectiveCloudCost + effectiveAICost).toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  + Enterprise subscription fee
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Free Tier Information */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Free Monthly Usage (All Plans)
          </CardTitle>
          <CardDescription>
            Every workspace gets free monthly usage (resets 1st of each month)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Cloud Balance</Label>
              </div>
              <p className="text-2xl font-bold text-primary">${CLOUD_FREE_TIER}</p>
              <p className="text-xs text-muted-foreground mt-1">
                For app hosting (temporary offering until end of 2025)
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">AI Balance</Label>
              </div>
              <p className="text-2xl font-bold text-primary">${AI_FREE_TIER}</p>
              <p className="text-xs text-muted-foreground mt-1">
                For AI features (temporary offering until end of 2025)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Costs Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Example Monthly Costs (From Lovable Docs)</CardTitle>
          <CardDescription>Real-world examples to help you estimate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(APP_PROFILES).filter(([key]) => key !== 'custom').map(([key, profile]) => (
              <div key={key} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{profile.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{profile.details}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium">
                      ${Math.max(0, profile.cloudCost - CLOUD_FREE_TIER) + Math.max(0, profile.aiCost - AI_FREE_TIER)}/mo
                    </p>
                    <p className="text-xs text-muted-foreground">after free tier</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LovableCostCalculator;
