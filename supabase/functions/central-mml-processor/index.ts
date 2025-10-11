import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  supporting_interactions: string[];
  metadata: any;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Central MML Processor...');

    // Get all customers
    const { data: customers, error: customerError } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .not('customer_id', 'is', null);

    if (customerError) throw customerError;

    const uniqueCustomerIds = [...new Set(customers?.map(c => c.customer_id))];
    console.log(`Processing ${uniqueCustomerIds.length} customers`);

    let totalInsightsGenerated = 0;

    for (const customerId of uniqueCustomerIds) {
      console.log(`Processing customer: ${customerId}`);

      // Get recent department insights (last 7 days, not already linked to global insights)
      const { data: insights, error: insightsError } = await supabase
        .from('department_insights')
        .select('*')
        .eq('customer_id', customerId)
        .is('global_insight_id', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (insightsError) {
        console.error(`Error fetching insights for customer ${customerId}:`, insightsError);
        continue;
      }

      if (!insights || insights.length < 2) {
        console.log(`Not enough insights for customer ${customerId}`);
        continue;
      }

      console.log(`Analyzing ${insights.length} insights for patterns...`);

      // Analyze cross-department patterns
      const globalInsights = await analyzeCrossDepartmentPatterns(insights as DepartmentInsight[]);

      // Save global insights
      for (const globalInsight of globalInsights) {
        const { data: newGlobalInsight, error: insertError } = await supabase
          .from('global_insights')
          .insert({
            customer_id: customerId,
            ...globalInsight
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting global insight:', insertError);
          continue;
        }

        totalInsightsGenerated++;
        console.log(`Generated global insight: ${newGlobalInsight.title}`);

        // Link department insights to this global insight
        const sourceIds = globalInsight.source_insight_ids;
        await supabase
          .from('department_insights')
          .update({ global_insight_id: newGlobalInsight.id })
          .in('id', sourceIds);

        // Detect and save correlations
        await detectCorrelations(supabase, customerId, sourceIds);
      }
    }

    console.log(`Central MML processing complete. Generated ${totalInsightsGenerated} global insights.`);

    return new Response(
      JSON.stringify({
        success: true,
        insightsGenerated: totalInsightsGenerated,
        message: 'Central MML processing completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in central-mml-processor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeCrossDepartmentPatterns(insights: DepartmentInsight[]) {
  const globalInsights: any[] = [];

  // Group insights by type
  const insightsByType = insights.reduce((acc, insight) => {
    if (!acc[insight.insight_type]) acc[insight.insight_type] = [];
    acc[insight.insight_type].push(insight);
    return acc;
  }, {} as Record<string, DepartmentInsight[]>);

  // Analyze knowledge gaps across departments
  const knowledgeGaps = insightsByType['knowledge_gap'] || [];
  if (knowledgeGaps.length >= 2) {
    const departments = [...new Set(knowledgeGaps.map(i => i.department))];
    if (departments.length >= 2) {
      // Cross-department knowledge gap identified
      const avgConfidence = knowledgeGaps.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / knowledgeGaps.length;
      
      globalInsights.push({
        insight_type: 'knowledge_gap',
        title: `Organization-wide Knowledge Gap: ${knowledgeGaps[0].title.split(':')[0]}`,
        description: `Multiple departments (${departments.join(', ')}) are experiencing similar knowledge gaps. This suggests a need for organization-wide training or documentation.`,
        affected_departments: departments,
        source_insight_ids: knowledgeGaps.map(i => i.id),
        confidence_score: avgConfidence,
        impact_level: avgConfidence > 0.7 ? 'high' : 'medium',
        priority: 4,
        recommended_actions: [
          { action: 'Create organization-wide training program', owner: 'HR', timeline: '2 weeks' },
          { action: 'Develop comprehensive documentation', owner: 'Knowledge Management', timeline: '1 week' },
          { action: 'Establish knowledge sharing sessions', owner: 'Department Heads', timeline: '1 week' }
        ],
        expected_impact: 'Improved efficiency across all affected departments, reduced duplicate questions',
        implementation_complexity: 'medium'
      });
    }
  }

  // Analyze process bottlenecks
  const bottlenecks = insightsByType['process_bottleneck'] || [];
  if (bottlenecks.length >= 2) {
    const departments = [...new Set(bottlenecks.map(i => i.department))];
    if (departments.length >= 2) {
      const avgImpact = bottlenecks.reduce((sum, i) => sum + (i.impact_score || 0), 0) / bottlenecks.length;
      
      globalInsights.push({
        insight_type: 'efficiency_opportunity',
        title: 'Cross-Department Process Inefficiency Detected',
        description: `Multiple departments are experiencing similar bottlenecks in their workflows. This indicates a systemic issue that could be addressed with process automation or resource reallocation.`,
        affected_departments: departments,
        source_insight_ids: bottlenecks.map(i => i.id),
        confidence_score: avgImpact / 10,
        impact_level: avgImpact > 7 ? 'high' : 'medium',
        priority: 5,
        recommended_actions: [
          { action: 'Conduct cross-department process review', owner: 'Operations', timeline: '1 week' },
          { action: 'Evaluate automation opportunities', owner: 'IT', timeline: '2 weeks' },
          { action: 'Optimize resource allocation', owner: 'Management', timeline: '1 week' }
        ],
        expected_impact: 'Reduced processing time, improved resource utilization, cost savings',
        implementation_complexity: 'high'
      });
    }
  }

  // Analyze frequent request patterns
  const frequentRequests = insights.filter(i => 
    i.insight_type === 'frequent_request' && 
    i.metadata?.request_count > 10
  );
  
  if (frequentRequests.length >= 2) {
    const departments = [...new Set(frequentRequests.map(i => i.department))];
    
    globalInsights.push({
      insight_type: 'process_improvement',
      title: 'Recurring Cross-Department Request Pattern',
      description: `Similar requests are being made frequently across ${departments.length} departments. This suggests an opportunity for process automation or self-service tools.`,
      affected_departments: departments,
      source_insight_ids: frequentRequests.map(i => i.id),
      confidence_score: 0.85,
      impact_level: 'medium',
      priority: 3,
      recommended_actions: [
        { action: 'Develop self-service portal for common requests', owner: 'IT', timeline: '3 weeks' },
        { action: 'Create FAQ documentation', owner: 'Support', timeline: '1 week' },
        { action: 'Implement chatbot for common queries', owner: 'AI Team', timeline: '4 weeks' }
      ],
      expected_impact: 'Reduced support burden, faster resolution times, improved user satisfaction',
      implementation_complexity: 'medium'
    });
  }

  // Detect contradictory insights (organizational risk)
  for (let i = 0; i < insights.length; i++) {
    for (let j = i + 1; j < insights.length; j++) {
      const insightA = insights[i];
      const insightB = insights[j];
      
      // Simple contradiction detection based on keywords
      if (insightA.department !== insightB.department) {
        const contradictory = detectContradiction(insightA, insightB);
        if (contradictory) {
          globalInsights.push({
            insight_type: 'organizational_risk',
            title: 'Contradictory Practices Detected',
            description: `Different departments are following contradictory approaches: "${insightA.title}" vs "${insightB.title}". This could lead to confusion and inefficiency.`,
            affected_departments: [insightA.department, insightB.department],
            source_insight_ids: [insightA.id, insightB.id],
            confidence_score: 0.7,
            impact_level: 'high',
            priority: 5,
            recommended_actions: [
              { action: 'Align departmental policies', owner: 'Management', timeline: '1 week' },
              { action: 'Establish standard operating procedures', owner: 'Operations', timeline: '2 weeks' },
              { action: 'Conduct cross-department alignment meeting', owner: 'Department Heads', timeline: '3 days' }
            ],
            expected_impact: 'Improved organizational alignment, reduced confusion, standardized practices',
            implementation_complexity: 'low'
          });
        }
      }
    }
  }

  return globalInsights;
}

function detectContradiction(insightA: DepartmentInsight, insightB: DepartmentInsight): boolean {
  // Simple keyword-based contradiction detection
  const contradictoryPairs = [
    ['increase', 'decrease'],
    ['add', 'remove'],
    ['approve', 'reject'],
    ['allow', 'restrict'],
    ['enable', 'disable']
  ];

  const textA = (insightA.title + ' ' + insightA.description).toLowerCase();
  const textB = (insightB.title + ' ' + insightB.description).toLowerCase();

  for (const [wordA, wordB] of contradictoryPairs) {
    if ((textA.includes(wordA) && textB.includes(wordB)) ||
        (textA.includes(wordB) && textB.includes(wordA))) {
      return true;
    }
  }

  return false;
}

async function detectCorrelations(supabase: any, customerId: string, insightIds: string[]) {
  // Simple temporal correlation: insights created close together
  for (let i = 0; i < insightIds.length; i++) {
    for (let j = i + 1; j < insightIds.length; j++) {
      await supabase
        .from('insight_correlations')
        .insert({
          customer_id: customerId,
          insight_a_id: insightIds[i],
          insight_b_id: insightIds[j],
          correlation_type: 'temporal',
          correlation_strength: 0.8,
          description: 'Insights occurred in the same time period and contributed to the same global insight'
        })
        .select();
    }
  }
}