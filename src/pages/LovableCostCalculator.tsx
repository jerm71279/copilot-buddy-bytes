import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Database, Cpu, Cloud, Brain } from 'lucide-react';

const LovableCostCalculator = () => {
  // User inputs - Enterprise defaults
  const [userCount, setUserCount] = useState(250);
  const [customerCount, setCustomerCount] = useState(10);
  const [lovableSeats, setLovableSeats] = useState(5);
  const [lovableTier, setLovableTier] = useState<'free' | 'pro' | 'team'>('team');
  
  // Cloud usage - Enterprise scale
  const [dbReadsPerMonth, setDbReadsPerMonth] = useState(500000);
  const [dbWritesPerMonth, setDbWritesPerMonth] = useState(250000);
  const [edgeFunctionCalls, setEdgeFunctionCalls] = useState(1000000);
  const [storageGB, setStorageGB] = useState(50);
  const [bandwidthGB, setBandwidthGB] = useState(200);
  
  // AI usage - Enterprise scale (from FILE_COLLABORATION_AI_INTEGRATION.md estimates)
  const [filesIndexedPerMonth, setFilesIndexedPerMonth] = useState(25000);
  const [semanticSearches, setSemanticSearches] = useState(100000);
  const [documentQA, setDocumentQA] = useState(50000);
  const [recommendations, setRecommendations] = useState(250000);
  const [complianceScans, setComplianceScans] = useState(25000);

  // Pricing constants
  const LOVABLE_PRICING = {
    free: 0,
    pro: 20,
    team: 40
  };

  const CLOUD_PRICING = {
    dbReads: 0.00001, // $0.01 per 1000 reads
    dbWrites: 0.0001, // $0.10 per 1000 writes
    edgeFunctions: 0.000002, // $2 per 1M invocations
    storage: 0.021, // $0.021 per GB/month
    bandwidth: 0.09 // $0.09 per GB
  };

  const AI_PRICING = {
    fileIndexing: 0.02,
    semanticSearch: 0.001,
    documentQA: 0.005,
    recommendations: 0.0001,
    complianceScans: 0.01
  };

  // Calculate costs
  const lovableSubscriptionCost = lovableSeats * LOVABLE_PRICING[lovableTier];
  
  const cloudCosts = {
    dbReads: (dbReadsPerMonth / 1000) * CLOUD_PRICING.dbReads,
    dbWrites: (dbWritesPerMonth / 1000) * CLOUD_PRICING.dbWrites,
    edgeFunctions: edgeFunctionCalls * CLOUD_PRICING.edgeFunctions,
    storage: storageGB * CLOUD_PRICING.storage,
    bandwidth: bandwidthGB * CLOUD_PRICING.bandwidth,
    total: 0
  };
  cloudCosts.total = Object.values(cloudCosts).reduce((sum, val) => sum + val, 0) - cloudCosts.total;
  
  const aiCosts = {
    fileIndexing: filesIndexedPerMonth * AI_PRICING.fileIndexing,
    semanticSearch: semanticSearches * AI_PRICING.semanticSearch,
    documentQA: documentQA * AI_PRICING.documentQA,
    recommendations: recommendations * AI_PRICING.recommendations,
    complianceScans: complianceScans * AI_PRICING.complianceScans,
    total: 0
  };
  aiCosts.total = Object.values(aiCosts).reduce((sum, val) => sum + val, 0) - aiCosts.total;

  const CLOUD_FREE_TIER = 25;
  const AI_FREE_TIER = 50;
  
  const effectiveCloudCost = Math.max(0, cloudCosts.total - CLOUD_FREE_TIER);
  const effectiveAICost = Math.max(0, aiCosts.total - AI_FREE_TIER);
  
  const totalMonthlyCost = lovableSubscriptionCost + effectiveCloudCost + effectiveAICost;

  // Revenue calculations - Enterprise pricing
  const avgRevenuePerCustomer = 2500; // Enterprise average (custom pricing, typically $2000-3000+)
  const monthlyRevenue = customerCount * avgRevenuePerCustomer;
  const profitMargin = ((monthlyRevenue - totalMonthlyCost) / monthlyRevenue) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lovable Cost Calculator</h1>
          <p className="text-muted-foreground">
            Calculate your total Lovable infrastructure costs based on actual usage
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <DollarSign className="h-4 w-4 mr-2" />
          ${totalMonthlyCost.toFixed(2)}/month
        </Badge>
      </div>

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
            <div className="text-2xl font-bold">${lovableSubscriptionCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lovableSeats} {lovableTier} seat{lovableSeats > 1 ? 's' : ''}
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
              ${cloudCosts.total.toFixed(2)} - ${CLOUD_FREE_TIER} free tier
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
              ${aiCosts.total.toFixed(2)} - ${AI_FREE_TIER} free tier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Analysis */}
      <Card className="border-accent/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue & Profit Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Monthly Revenue</Label>
              <p className="text-2xl font-bold text-primary">${monthlyRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{customerCount} customers</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Total Costs</Label>
              <p className="text-2xl font-bold">${totalMonthlyCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">All infrastructure</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Profit Margin</Label>
              <p className="text-2xl font-bold text-primary">{profitMargin.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                ${(monthlyRevenue - totalMonthlyCost).toFixed(2)} profit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Business Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Business Parameters</CardTitle>
            <CardDescription>Your customer base and team size</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>End Users: {userCount}</Label>
              <Slider
                value={[userCount]}
                onValueChange={(v) => setUserCount(v[0])}
                min={10}
                max={1000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <Label>Paying Customers: {customerCount}</Label>
              <Slider
                value={[customerCount]}
                onValueChange={(v) => setCustomerCount(v[0])}
                min={1}
                max={50}
                step={1}
              />
            </div>

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

            <div className="space-y-2">
              <Label>Lovable Subscription Tier</Label>
              <Select value={lovableTier} onValueChange={(v: any) => setLovableTier(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (Limited)</SelectItem>
                  <SelectItem value="pro">Pro ($20/seat/month)</SelectItem>
                  <SelectItem value="team">Team ($40/seat/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cloud Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Lovable Cloud Usage
            </CardTitle>
            <CardDescription>Database, storage, and edge functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>DB Reads/Month: {dbReadsPerMonth.toLocaleString()}</Label>
              <Input
                type="number"
                value={dbReadsPerMonth}
                onChange={(e) => setDbReadsPerMonth(Number(e.target.value))}
                min={0}
                step={10000}
              />
              <p className="text-xs text-muted-foreground">
                ${cloudCosts.dbReads.toFixed(2)}/month
              </p>
            </div>

            <div className="space-y-2">
              <Label>DB Writes/Month: {dbWritesPerMonth.toLocaleString()}</Label>
              <Input
                type="number"
                value={dbWritesPerMonth}
                onChange={(e) => setDbWritesPerMonth(Number(e.target.value))}
                min={0}
                step={5000}
              />
              <p className="text-xs text-muted-foreground">
                ${cloudCosts.dbWrites.toFixed(2)}/month
              </p>
            </div>

            <div className="space-y-2">
              <Label>Edge Function Calls/Month: {edgeFunctionCalls.toLocaleString()}</Label>
              <Input
                type="number"
                value={edgeFunctionCalls}
                onChange={(e) => setEdgeFunctionCalls(Number(e.target.value))}
                min={0}
                step={10000}
              />
              <p className="text-xs text-muted-foreground">
                ${cloudCosts.edgeFunctions.toFixed(2)}/month
              </p>
            </div>

            <div className="space-y-2">
              <Label>Storage (GB): {storageGB}</Label>
              <Slider
                value={[storageGB]}
                onValueChange={(v) => setStorageGB(v[0])}
                min={0}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                ${cloudCosts.storage.toFixed(2)}/month
              </p>
            </div>

            <div className="space-y-2">
              <Label>Bandwidth (GB): {bandwidthGB}</Label>
              <Slider
                value={[bandwidthGB]}
                onValueChange={(v) => setBandwidthGB(v[0])}
                min={0}
                max={500}
                step={10}
              />
              <p className="text-xs text-muted-foreground">
                ${cloudCosts.bandwidth.toFixed(2)}/month
              </p>
            </div>

            <Separator />
            <div className="flex justify-between items-center">
              <Label>Cloud Subtotal:</Label>
              <span className="font-bold">${cloudCosts.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Lovable AI Usage (File Collaboration)
          </CardTitle>
          <CardDescription>AI-powered file indexing, search, and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Files Indexed/Month: {filesIndexedPerMonth.toLocaleString()}</Label>
              <Input
                type="number"
                value={filesIndexedPerMonth}
                onChange={(e) => setFilesIndexedPerMonth(Number(e.target.value))}
                min={0}
                step={500}
              />
              <p className="text-xs text-muted-foreground">
                ${aiCosts.fileIndexing.toFixed(2)}/month ($0.02 per file)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Semantic Searches: {semanticSearches.toLocaleString()}</Label>
              <Input
                type="number"
                value={semanticSearches}
                onChange={(e) => setSemanticSearches(Number(e.target.value))}
                min={0}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">
                ${aiCosts.semanticSearch.toFixed(2)}/month ($0.001 per search)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Document Q&A: {documentQA.toLocaleString()}</Label>
              <Input
                type="number"
                value={documentQA}
                onChange={(e) => setDocumentQA(Number(e.target.value))}
                min={0}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">
                ${aiCosts.documentQA.toFixed(2)}/month ($0.005 per question)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Recommendations: {recommendations.toLocaleString()}</Label>
              <Input
                type="number"
                value={recommendations}
                onChange={(e) => setRecommendations(Number(e.target.value))}
                min={0}
                step={5000}
              />
              <p className="text-xs text-muted-foreground">
                ${aiCosts.recommendations.toFixed(2)}/month ($0.0001 per request)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Compliance Scans: {complianceScans.toLocaleString()}</Label>
              <Input
                type="number"
                value={complianceScans}
                onChange={(e) => setComplianceScans(Number(e.target.value))}
                min={0}
                step={500}
              />
              <p className="text-xs text-muted-foreground">
                ${aiCosts.complianceScans.toFixed(2)}/month ($0.01 per scan)
              </p>
            </div>
          </div>

          <Separator className="my-6" />
          <div className="flex justify-between items-center">
            <Label>AI Subtotal:</Label>
            <span className="font-bold">${aiCosts.total.toFixed(2)}</span>
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
              <span className="text-sm">Lovable Subscription ({lovableSeats} {lovableTier} seats)</span>
              <span className="font-medium">${lovableSubscriptionCost.toFixed(2)}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Cloud Usage (before free tier)</span>
              <span>${cloudCosts.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-primary">
              <span>Cloud Free Tier Discount</span>
              <span>-${Math.min(CLOUD_FREE_TIER, cloudCosts.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cloud (after free tier)</span>
              <span className="font-medium">${effectiveCloudCost.toFixed(2)}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>AI Usage (before free tier)</span>
              <span>${aiCosts.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-primary">
              <span>AI Free Tier Discount</span>
              <span>-${Math.min(AI_FREE_TIER, aiCosts.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">AI (after free tier)</span>
              <span className="font-medium">${effectiveAICost.toFixed(2)}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Monthly Cost</span>
              <span className="text-primary">${totalMonthlyCost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Annual Cost (if paid yearly)</span>
              <span>${(totalMonthlyCost * 12).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LovableCostCalculator;
