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
  const [lovableTier, setLovableTier] = useState<'free' | 'pro' | 'team' | 'enterprise'>('team');
  
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

  // Calculate costs
  const lovableSubscriptionCost = lovableTier === 'enterprise' 
    ? 0 
    : lovableSeats * LOVABLE_PRICING[lovableTier];
  
  const selectedProfile = APP_PROFILES[appType];
  const rawCloudCost = appType === 'custom' ? cloudEstimate : selectedProfile.cloudCost;
  const rawAICost = appType === 'custom' ? aiEstimate : selectedProfile.aiCost;
  
  const effectiveCloudCost = Math.max(0, rawCloudCost - CLOUD_FREE_TIER);
  const effectiveAICost = Math.max(0, rawAICost - AI_FREE_TIER);
  
  const totalMonthlyCost = lovableSubscriptionCost + effectiveCloudCost + effectiveAICost;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lovable Cost Calculator</h1>
          <p className="text-muted-foreground">
            Estimate your monthly Lovable costs based on app profile and usage
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <DollarSign className="h-4 w-4 mr-2" />
          {lovableTier === 'enterprise' ? 'Custom Pricing' : `$${totalMonthlyCost.toFixed(2)}/month`}
        </Badge>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cost Summary Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lovable Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lovableTier === 'enterprise' ? 'Custom' : `$${lovableSubscriptionCost.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lovableTier === 'enterprise' 
                ? 'Contact sales for pricing' 
                : `${lovableSeats} ${lovableTier} seat${lovableSeats > 1 ? 's' : ''}`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Lovable Cloud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${effectiveCloudCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${rawCloudCost.toFixed(2)} - ${Math.min(CLOUD_FREE_TIER, rawCloudCost).toFixed(2)} free tier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Lovable AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${effectiveAICost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${rawAICost.toFixed(2)} - ${Math.min(AI_FREE_TIER, rawAICost).toFixed(2)} free tier
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lovable Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Lovable Subscription</CardTitle>
            <CardDescription>Your team's Lovable plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {lovableTier !== 'enterprise' && (
              <div className="space-y-2">
                <Label>Lovable Team Seats: {lovableSeats}</Label>
                <Slider
                  value={[lovableSeats]}
                  onValueChange={(v) => setLovableSeats(v[0])}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            )}

            {lovableTier === 'enterprise' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Enterprise Plan:</strong> Custom pricing based on your needs. Contact{' '}
                  <a href="mailto:sales@lovable.dev" className="underline">sales@lovable.dev</a> for a quote.
                  This calculator shows Cloud and AI costs only.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Lovable Subscription Tier</Label>
              <Select value={lovableTier} onValueChange={(v: any) => setLovableTier(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (Limited features)</SelectItem>
                  <SelectItem value="pro">Pro ($20/seat/month)</SelectItem>
                  <SelectItem value="team">Team ($40/seat/month)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (Custom pricing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Cost Breakdown</CardTitle>
          <CardDescription>Monthly costs with free tier deductions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">
                Lovable Subscription {lovableTier === 'enterprise' 
                  ? '(Enterprise - Custom Pricing)' 
                  : `(${lovableSeats} ${lovableTier} seat${lovableSeats > 1 ? 's' : ''})`
                }
              </span>
              <span className="font-medium">
                {lovableTier === 'enterprise' ? 'Contact Sales' : `$${lovableSubscriptionCost.toFixed(2)}`}
              </span>
            </div>
            <Separator />
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Cloud Usage (before free tier)</span>
              <span>${rawCloudCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-primary">
              <span>Cloud Free Tier Discount</span>
              <span>-${Math.min(CLOUD_FREE_TIER, rawCloudCost).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cloud (after free tier)</span>
              <span className="font-medium">${effectiveCloudCost.toFixed(2)}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>AI Usage (before free tier)</span>
              <span>${rawAICost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-primary">
              <span>AI Free Tier Discount</span>
              <span>-${Math.min(AI_FREE_TIER, rawAICost).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">AI (after free tier)</span>
              <span className="font-medium">${effectiveAICost.toFixed(2)}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Monthly Cost {lovableTier === 'enterprise' && '(Cloud + AI only)'}</span>
              <span className="text-primary">
                {lovableTier === 'enterprise' 
                  ? `$${(effectiveCloudCost + effectiveAICost).toFixed(2)} + Enterprise Fee` 
                  : `$${totalMonthlyCost.toFixed(2)}`
                }
              </span>
            </div>
            
            {lovableTier !== 'enterprise' && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Annual Cost (if paid yearly)</span>
                <span>${(totalMonthlyCost * 12).toFixed(2)}</span>
              </div>
            )}
          </div>

          <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Important:</strong> Cloud and AI costs are usage-based and billed separately from your subscription. 
              Free plan users must upgrade to add funds beyond the free tier. Unused free funds reset monthly and don't roll over.
            </AlertDescription>
          </Alert>
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
