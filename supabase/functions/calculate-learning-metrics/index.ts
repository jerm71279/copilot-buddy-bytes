import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricResult {
  metric_type: string;
  metric_category: string;
  time_period: string;
  metric_value: number;
  baseline_value?: number;
  improvement_percentage?: number;
  sample_size: number;
  metadata: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { customer_id, time_periods = ['7d', '30d', '90d', 'all_time'] } = await req.json();

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metrics: MetricResult[] = [];

    // Calculate metrics for each time period
    for (const period of time_periods) {
      const days = period === 'all_time' ? 365 * 10 : parseInt(period);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // 1. Confidence Score Improvements (Layer 1 & 2)
      const { data: interactions } = await supabase
        .from('ai_interactions')
        .select('confidence_score, created_at')
        .eq('customer_id', customer_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (interactions && interactions.length > 1) {
        const firstHalf = interactions.slice(0, Math.floor(interactions.length / 2));
        const secondHalf = interactions.slice(Math.floor(interactions.length / 2));
        
        const avgFirst = firstHalf.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / secondHalf.length;
        
        const improvement = ((avgSecond - avgFirst) / avgFirst) * 100;

        metrics.push({
          metric_type: 'confidence_improvement',
          metric_category: 'layer_1_knowledge',
          time_period: period,
          metric_value: avgSecond,
          baseline_value: avgFirst,
          improvement_percentage: improvement,
          sample_size: interactions.length,
          metadata: {
            first_period_avg: avgFirst,
            second_period_avg: avgSecond,
            trend: improvement > 0 ? 'improving' : 'declining'
          }
        });
      }

      const { data: insights } = await supabase
        .from('knowledge_insights')
        .select('confidence, created_at')
        .eq('customer_id', customer_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (insights && insights.length > 1) {
        const firstHalf = insights.slice(0, Math.floor(insights.length / 2));
        const secondHalf = insights.slice(Math.floor(insights.length / 2));
        
        const avgFirst = firstHalf.reduce((sum, i) => sum + (i.confidence || 0), 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, i) => sum + (i.confidence || 0), 0) / secondHalf.length;
        
        const improvement = ((avgSecond - avgFirst) / avgFirst) * 100;

        metrics.push({
          metric_type: 'confidence_improvement',
          metric_category: 'layer_2_workflow',
          time_period: period,
          metric_value: avgSecond,
          baseline_value: avgFirst,
          improvement_percentage: improvement,
          sample_size: insights.length,
          metadata: {
            first_period_avg: avgFirst,
            second_period_avg: avgSecond,
            trend: improvement > 0 ? 'improving' : 'declining'
          }
        });
      }

      // 2. Pattern Reuse Rate
      const { data: patterns } = await supabase
        .from('ai_patterns')
        .select('id, usage_count, created_at')
        .eq('customer_id', customer_id)
        .gte('created_at', startDate);

      if (patterns && patterns.length > 0) {
        const totalUsage = patterns.reduce((sum, p) => sum + (p.usage_count || 0), 0);
        const avgReuse = totalUsage / patterns.length;
        const reuseRate = (patterns.filter(p => (p.usage_count || 0) > 1).length / patterns.length) * 100;

        metrics.push({
          metric_type: 'pattern_reuse',
          metric_category: 'layer_2_workflow',
          time_period: period,
          metric_value: reuseRate,
          sample_size: patterns.length,
          metadata: {
            total_patterns: patterns.length,
            total_usage: totalUsage,
            avg_reuse_per_pattern: avgReuse,
            highly_reused: patterns.filter(p => (p.usage_count || 0) > 5).length
          }
        });
      }

      // 3. Knowledge Article Effectiveness
      const { data: articles } = await supabase
        .from('knowledge_articles')
        .select('id, view_count, helpful_count, not_helpful_count, created_at')
        .eq('customer_id', customer_id)
        .gte('created_at', startDate);

      if (articles && articles.length > 0) {
        const totalViews = articles.reduce((sum, a) => sum + (a.view_count || 0), 0);
        const totalHelpful = articles.reduce((sum, a) => sum + (a.helpful_count || 0), 0);
        const totalNotHelpful = articles.reduce((sum, a) => sum + (a.not_helpful_count || 0), 0);
        
        const helpfulnessRate = totalHelpful + totalNotHelpful > 0 
          ? (totalHelpful / (totalHelpful + totalNotHelpful)) * 100 
          : 0;

        metrics.push({
          metric_type: 'knowledge_effectiveness',
          metric_category: 'layer_1_knowledge',
          time_period: period,
          metric_value: helpfulnessRate,
          sample_size: articles.length,
          metadata: {
            total_articles: articles.length,
            total_views: totalViews,
            total_helpful: totalHelpful,
            total_not_helpful: totalNotHelpful,
            avg_views_per_article: totalViews / articles.length
          }
        });
      }

      // 4. AI Agent Learning Velocity (Layer 3)
      const { data: learning } = await supabase
        .from('ai_agent_learning')
        .select('id, applied_count, success_rate, confidence_score, created_at, last_applied_at')
        .eq('customer_id', customer_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (learning && learning.length > 0) {
        const learningsApplied = learning.filter(l => (l.applied_count || 0) > 0).length;
        const applicationRate = (learningsApplied / learning.length) * 100;
        const avgSuccessRate = learning
          .filter(l => l.success_rate !== null)
          .reduce((sum, l) => sum + (l.success_rate || 0), 0) / learning.filter(l => l.success_rate !== null).length || 0;
        
        const timeToFirstApplication = learning
          .filter(l => l.last_applied_at)
          .map(l => new Date(l.last_applied_at!).getTime() - new Date(l.created_at).getTime())
          .reduce((sum, time) => sum + time, 0) / learning.filter(l => l.last_applied_at).length || 0;
        
        const avgDaysToApply = timeToFirstApplication / (1000 * 60 * 60 * 24);

        metrics.push({
          metric_type: 'learning_velocity',
          metric_category: 'layer_3_department',
          time_period: period,
          metric_value: applicationRate,
          sample_size: learning.length,
          metadata: {
            total_learnings: learning.length,
            learnings_applied: learningsApplied,
            avg_success_rate: avgSuccessRate,
            avg_days_to_first_application: avgDaysToApply,
            high_confidence_learnings: learning.filter(l => (l.confidence_score || 0) > 0.8).length
          }
        });
      }
    }

    // Insert all metrics into the database
    if (metrics.length > 0) {
      const { error: insertError } = await supabase
        .from('ai_learning_metrics')
        .insert(
          metrics.map(m => ({
            customer_id,
            ...m
          }))
        );

      if (insertError) {
        console.error('Error inserting metrics:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store metrics', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get summary of calculated metrics
    const summary = {
      total_metrics_calculated: metrics.length,
      by_category: {
        layer_1_knowledge: metrics.filter(m => m.metric_category === 'layer_1_knowledge').length,
        layer_2_workflow: metrics.filter(m => m.metric_category === 'layer_2_workflow').length,
        layer_3_department: metrics.filter(m => m.metric_category === 'layer_3_department').length
      },
      by_type: {
        confidence_improvement: metrics.filter(m => m.metric_type === 'confidence_improvement').length,
        pattern_reuse: metrics.filter(m => m.metric_type === 'pattern_reuse').length,
        knowledge_effectiveness: metrics.filter(m => m.metric_type === 'knowledge_effectiveness').length,
        learning_velocity: metrics.filter(m => m.metric_type === 'learning_velocity').length
      },
      metrics
    };

    console.log(`Successfully calculated ${metrics.length} learning metrics for customer ${customer_id}`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-learning-metrics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
