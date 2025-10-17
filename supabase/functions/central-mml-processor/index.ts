import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepartmentInsight {
  id: string;
  customer_id: string;
  department: string;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  impact_score: number;
  frequency_count: number;
  affected_users: number;
  first_detected_at?: string;
  metadata: any;
}

interface CorrelationCandidate {
  insight1: DepartmentInsight;
  insight2: DepartmentInsight;
  strength: number;
  correlationType: 'positive' | 'negative' | 'causal';
  evidence: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧠 Starting Central MML Analysis...');

    // Get all customers with recent department insights
    const { data: customers, error: customersError } = await supabase
      .from('department_insights')
      .select('customer_id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('customer_id');

    if (customersError) throw customersError;

    const uniqueCustomers = [...new Set(customers?.map(c => c.customer_id) || [])];
    console.log(`📊 Processing ${uniqueCustomers.length} customers`);

    let totalGlobalInsights = 0;
    let totalCorrelations = 0;

    for (const customerId of uniqueCustomers) {
      try {
        const result = await processCustomerInsights(supabase, customerId);
        totalGlobalInsights += result.insights;
        totalCorrelations += result.correlations;
      } catch (error) {
        console.error(`❌ Error processing customer ${customerId}:`, error);
      }
    }

    console.log(`✅ Analysis complete: ${totalGlobalInsights} global insights, ${totalCorrelations} correlations`);

    return new Response(
      JSON.stringify({
        success: true,
        customersProcessed: uniqueCustomers.length,
        globalInsightsGenerated: totalGlobalInsights,
        correlationsFound: totalCorrelations,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Central MML Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processCustomerInsights(supabase: any, customerId: string): Promise<{ insights: number; correlations: number }> {
  // Get recent high-quality department insights (last 7 days, confidence > 60%)
  const { data: insights, error: insightsError } = await supabase
    .from('department_insights')
    .select('*')
    .eq('customer_id', customerId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .gte('confidence_score', 0.6)
    .order('impact_score', { ascending: false });

  if (insightsError) throw insightsError;
  if (!insights || insights.length < 2) return { insights: 0, correlations: 0 };

  console.log(`  📈 Processing ${insights.length} insights for customer ${customerId}`);

  // Identify cross-department patterns
  const correlations = await findCorrelations(insights);
  console.log(`  🔗 Found ${correlations.length} potential correlations`);
  
  // Store correlations
  let storedCorrelations = 0;
  for (const correlation of correlations) {
    const stored = await storeCorrelation(supabase, customerId, correlation);
    if (stored) storedCorrelations++;
  }

  // Generate global insights from correlations
  let generatedInsights = 0;
  if (correlations.length > 0) {
    generatedInsights = await generateGlobalInsights(supabase, customerId, insights, correlations);
  }

  return { insights: generatedInsights, correlations: storedCorrelations };
}

async function findCorrelations(insights: DepartmentInsight[]): Promise<CorrelationCandidate[]> {
  const correlations: CorrelationCandidate[] = [];

  // Only look for cross-department correlations
  for (let i = 0; i < insights.length; i++) {
    for (let j = i + 1; j < insights.length; j++) {
      const insight1 = insights[i];
      const insight2 = insights[j];

      // Skip if same department
      if (insight1.department === insight2.department) continue;

      // Calculate correlation
      const correlation = calculateCorrelation(insight1, insight2);
      
      // Only keep strong correlations (>= 50%)
      if (correlation.strength >= 0.5) {
        correlations.push(correlation);
      }
    }
  }

  // Return top 10 strongest correlations
  return correlations.sort((a, b) => b.strength - a.strength).slice(0, 10);
}

function calculateCorrelation(
  insight1: DepartmentInsight,
  insight2: DepartmentInsight
): CorrelationCandidate {
  let strength = 0;
  let correlationType: 'positive' | 'negative' | 'causal' = 'positive';
  const evidence: any = {};

  // 1. Temporal proximity (occurred within 48 hours)
  if (insight1.first_detected_at && insight2.first_detected_at) {
    const timeDiff = Math.abs(
      new Date(insight1.first_detected_at).getTime() - 
      new Date(insight2.first_detected_at).getTime()
    );
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff <= 48) {
      strength += 0.3;
      evidence.temporalProximity = `${hoursDiff.toFixed(0)} hours apart`;
    }
  }

  // 2. Similar insight types
  if (insight1.insight_type === insight2.insight_type) {
    strength += 0.2;
    evidence.sameType = insight1.insight_type;
  }

  // 3. Related keywords in descriptions
  const keywords1 = extractKeywords(insight1.description + ' ' + insight1.title);
  const keywords2 = extractKeywords(insight2.description + ' ' + insight2.title);
  const commonKeywords = keywords1.filter(k => keywords2.includes(k));
  
  if (commonKeywords.length > 0) {
    strength += Math.min(0.3, commonKeywords.length * 0.1);
    evidence.commonKeywords = commonKeywords;
  }

  // 4. Similar impact levels
  const impactDiff = Math.abs(insight1.impact_score - insight2.impact_score);
  if (impactDiff <= 2) {
    strength += 0.2;
    evidence.similarImpact = true;
  }

  // Determine correlation type based on insight patterns
  if (insight1.insight_type === 'bottleneck' && insight2.insight_type === 'bottleneck') {
    correlationType = 'causal';
  } else if (insight1.insight_type === 'opportunity' && insight2.insight_type === 'opportunity') {
    correlationType = 'positive';
  } else if (
    (insight1.insight_type === 'risk' && insight2.insight_type === 'bottleneck') ||
    (insight1.insight_type === 'bottleneck' && insight2.insight_type === 'risk')
  ) {
    correlationType = 'causal';
  }

  return {
    insight1,
    insight2,
    strength: Math.min(1, strength),
    correlationType,
    evidence
  };
}

function extractKeywords(text: string): string[] {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'this', 'that', 'from'];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 15);
}

async function storeCorrelation(
  supabase: any,
  customerId: string,
  correlation: CorrelationCandidate
): Promise<boolean> {
  // Check if correlation already exists
  const { data: existing } = await supabase
    .from('insight_correlations')
    .select('id')
    .eq('customer_id', customerId)
    .eq('insight_1_id', correlation.insight1.id)
    .eq('insight_2_id', correlation.insight2.id)
    .maybeSingle();

  if (existing) return false;

  const { error } = await supabase
    .from('insight_correlations')
    .insert({
      customer_id: customerId,
      dept_1: correlation.insight1.department,
      dept_2: correlation.insight2.department,
      correlation_type: correlation.correlationType,
      strength: correlation.strength,
      insight_1_id: correlation.insight1.id,
      insight_2_id: correlation.insight2.id,
      evidence: correlation.evidence
    });

  return !error;
}

async function generateGlobalInsights(
  supabase: any,
  customerId: string,
  insights: DepartmentInsight[],
  correlations: CorrelationCandidate[]
): Promise<number> {
  let created = 0;

  // Generate insights for top 5 strongest correlations
  for (const correlation of correlations.slice(0, 5)) {
    const affectedDepts = [correlation.insight1.department, correlation.insight2.department];
    const sourceInsights = [correlation.insight1.id, correlation.insight2.id];

    let title = '';
    let description = '';
    let insightType: 'cross_dept_pattern' | 'org_trend' | 'innovation_opportunity' = 'cross_dept_pattern';
    let recommendations: any[] = [];
    let roiEstimate: number | null = null;

    if (correlation.correlationType === 'causal') {
      title = `Cross-Department Impact: ${correlation.insight1.department} → ${correlation.insight2.department}`;
      description = `Analysis reveals ${correlation.insight1.title} in ${correlation.insight1.department} is correlated with ${correlation.insight2.title} in ${correlation.insight2.department}. This suggests a causal relationship (${(correlation.strength * 100).toFixed(0)}% confidence) that could be addressed with coordinated action.`;
      insightType = 'cross_dept_pattern';
      
      recommendations = [
        {
          action: `Establish coordination between ${correlation.insight1.department} and ${correlation.insight2.department}`,
          priority: 'high',
          estimatedImpact: 'Addressing root cause could resolve both issues simultaneously'
        },
        {
          action: 'Create cross-functional task force',
          priority: 'medium',
          estimatedImpact: 'Improved visibility and faster issue resolution'
        },
        {
          action: 'Implement shared metrics dashboard',
          priority: 'low',
          estimatedImpact: 'Early warning system for future occurrences'
        }
      ];

      // Estimate ROI based on affected users and impact
      const totalAffected = correlation.insight1.affected_users + correlation.insight2.affected_users;
      roiEstimate = totalAffected * 100; // $100 per affected user

    } else if (correlation.correlationType === 'positive') {
      title = `Organization-Wide Trend: ${affectedDepts.join(' & ')}`;
      description = `Both ${correlation.insight1.department} and ${correlation.insight2.department} are experiencing parallel patterns in ${correlation.insight1.insight_type}s. This organization-wide trend (${(correlation.strength * 100).toFixed(0)}% strength) suggests systemic factors at play.`;
      insightType = 'org_trend';
      
      recommendations = [
        {
          action: 'Conduct organization-wide assessment',
          priority: 'high',
          estimatedImpact: 'Identify systemic root causes'
        },
        {
          action: 'Share successful strategies across departments',
          priority: 'medium',
          estimatedImpact: 'Leverage best practices organization-wide'
        }
      ];

      roiEstimate = (correlation.insight1.affected_users + correlation.insight2.affected_users) * 75;
    }

    const avgImpact = Math.round((correlation.insight1.impact_score + correlation.insight2.impact_score) / 2);
    const avgConfidence = (correlation.insight1.confidence_score + correlation.insight2.confidence_score) / 2;

    // Check if similar insight already exists (last 7 days)
    const { data: existing } = await supabase
      .from('global_insights')
      .select('id')
      .eq('customer_id', customerId)
      .eq('title', title)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existing) continue;

    const { error } = await supabase
      .from('global_insights')
      .insert({
        customer_id: customerId,
        insight_type: insightType,
        title,
        description,
        affected_departments: affectedDepts,
        source_insights: sourceInsights,
        confidence_score: Number((correlation.strength * avgConfidence).toFixed(2)),
        impact_score: Math.min(10, avgImpact + 2),
        actionable_recommendations: recommendations,
        roi_estimate: roiEstimate,
        implementation_complexity: correlation.strength > 0.8 ? 'high' : 'medium',
        status: 'new'
      });

    if (!error) {
      created++;
      console.log(`  ✨ Created global insight: ${title}`);
    }
  }

  return created;
}
