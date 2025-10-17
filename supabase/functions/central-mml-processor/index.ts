import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepartmentInsight {
  id: string;
  customer_id: string;
  department: string;
  insight_type: string;
  insight_data: any;
  confidence_score: number;
  created_at: string;
}

interface GlobalInsightPattern {
  pattern_type: string;
  affected_departments: string[];
  frequency: number;
  confidence_score: number;
  recommended_actions: string[];
  insight_data: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    // Service role client for cron job
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Central MML] Starting cross-department intelligence analysis...');

    // Get all department insights from last 7 days
    const { data: recentInsights, error: insightsError } = await supabase
      .from('department_insights')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (insightsError) {
      console.error('[Central MML] Error fetching insights:', insightsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch insights' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recentInsights || recentInsights.length === 0) {
      console.log('[Central MML] No recent insights to process');
      return new Response(
        JSON.stringify({ message: 'No insights to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Central MML] Analyzing ${recentInsights.length} insights from ${new Set(recentInsights.map(i => i.department)).size} departments`);

    // Group insights by customer and pattern type
    const customerInsights = new Map<string, DepartmentInsight[]>();
    recentInsights.forEach((insight: DepartmentInsight) => {
      const existing = customerInsights.get(insight.customer_id) || [];
      customerInsights.set(insight.customer_id, [...existing, insight]);
    });

    const globalInsightsCreated: any[] = [];
    const correlationsCreated: any[] = [];
    const articlesCreated: any[] = [];

    // Process each customer's insights
    for (const [customerId, insights] of customerInsights.entries()) {
      console.log(`[Central MML] Processing ${insights.length} insights for customer ${customerId}`);

      // Identify cross-department patterns
      const patterns = identifyCrossDepartmentPatterns(insights);

      for (const pattern of patterns) {
        // Create global insight
        const { data: globalInsight, error: globalError } = await supabase
          .from('global_insights')
          .insert({
            customer_id: customerId,
            insight_type: pattern.pattern_type,
            affected_departments: pattern.affected_departments,
            confidence_score: pattern.confidence_score,
            insight_data: pattern.insight_data,
            source_insight_count: pattern.frequency,
            recommended_actions: pattern.recommended_actions,
          })
          .select()
          .maybeSingle();

        if (globalError) {
          console.error('[Central MML] Error creating global insight:', globalError);
          continue;
        }

        if (globalInsight) {
          globalInsightsCreated.push(globalInsight);
          console.log(`[Central MML] Created global insight: ${pattern.pattern_type}`);

          // Create correlations between department insights
          const correlations = createInsightCorrelations(insights, pattern, globalInsight.id);
          
          for (const correlation of correlations) {
            const { error: corrError } = await supabase
              .from('insight_correlations')
              .insert(correlation);

            if (!corrError) {
              correlationsCreated.push(correlation);
            }
          }

          // Auto-generate knowledge article if pattern is frequent
          if (pattern.frequency >= 3 && pattern.confidence_score > 0.7) {
            const article = await generateKnowledgeArticle(
              supabase,
              customerId,
              pattern,
              lovableApiKey
            );

            if (article) {
              articlesCreated.push(article);
              console.log(`[Central MML] Auto-generated knowledge article: ${article.title}`);
            }
          }

          // Create feedback loop to departments
          await createInsightFeedback(supabase, customerId, globalInsight, pattern);
        }
      }
    }

    console.log(`[Central MML] Analysis complete: ${globalInsightsCreated.length} global insights, ${correlationsCreated.length} correlations, ${articlesCreated.length} articles`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: recentInsights.length,
        global_insights_created: globalInsightsCreated.length,
        correlations_created: correlationsCreated.length,
        articles_created: articlesCreated.length,
        insights: globalInsightsCreated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Central MML] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function identifyCrossDepartmentPatterns(insights: DepartmentInsight[]): GlobalInsightPattern[] {
  const patterns: GlobalInsightPattern[] = [];
  const insightsByType = new Map<string, DepartmentInsight[]>();

  // Group by insight type
  insights.forEach(insight => {
    const existing = insightsByType.get(insight.insight_type) || [];
    insightsByType.set(insight.insight_type, [...existing, insight]);
  });

  // Identify patterns that appear across multiple departments
  for (const [type, typeInsights] of insightsByType.entries()) {
    const departments = new Set(typeInsights.map(i => i.department));
    
    // Pattern only if it appears in 2+ departments
    if (departments.size >= 2) {
      const avgConfidence = typeInsights.reduce((sum, i) => sum + i.confidence_score, 0) / typeInsights.length;
      
      // Extract common themes from insight data
      const commonThemes = extractCommonThemes(typeInsights);
      const recommendedActions = generateRecommendedActions(type, commonThemes, Array.from(departments));

      patterns.push({
        pattern_type: type,
        affected_departments: Array.from(departments),
        frequency: typeInsights.length,
        confidence_score: avgConfidence,
        recommended_actions: recommendedActions,
        insight_data: {
          common_themes: commonThemes,
          department_counts: Object.fromEntries(
            Array.from(departments).map(dept => [
              dept,
              typeInsights.filter(i => i.department === dept).length
            ])
          ),
          sample_insights: typeInsights.slice(0, 3).map(i => i.insight_data),
        },
      });
    }
  }

  return patterns;
}

function extractCommonThemes(insights: DepartmentInsight[]): string[] {
  const themes = new Set<string>();
  
  insights.forEach(insight => {
    if (insight.insight_data?.keywords) {
      insight.insight_data.keywords.forEach((kw: string) => themes.add(kw));
    }
    if (insight.insight_data?.category) {
      themes.add(insight.insight_data.category);
    }
  });

  return Array.from(themes).slice(0, 5);
}

function generateRecommendedActions(type: string, themes: string[], departments: string[]): string[] {
  const actions: string[] = [];

  if (type === 'repeated_question') {
    actions.push('Create knowledge article to address common question');
    actions.push(`Train ${departments.join(', ')} staff on this topic`);
  } else if (type === 'process_bottleneck') {
    actions.push('Implement workflow automation');
    actions.push('Cross-train teams to reduce bottleneck');
  } else if (type === 'compliance_gap') {
    actions.push('Schedule organization-wide compliance review');
    actions.push('Update policies and procedures');
  } else if (type === 'security_concern') {
    actions.push('Conduct security awareness training');
    actions.push('Review and update access controls');
  }

  if (themes.length > 0) {
    actions.push(`Focus on: ${themes.join(', ')}`);
  }

  return actions;
}

function createInsightCorrelations(
  insights: DepartmentInsight[],
  pattern: GlobalInsightPattern,
  globalInsightId: string
): any[] {
  const correlations: any[] = [];

  // Find related insights
  const patternInsights = insights.filter(i => 
    pattern.affected_departments.includes(i.department) &&
    i.insight_type === pattern.pattern_type
  );

  // Create correlations between pairs
  for (let i = 0; i < patternInsights.length; i++) {
    for (let j = i + 1; j < patternInsights.length; j++) {
      correlations.push({
        global_insight_id: globalInsightId,
        department_insight_1_id: patternInsights[i].id,
        department_insight_2_id: patternInsights[j].id,
        correlation_strength: pattern.confidence_score,
        correlation_type: 'cross_department_pattern',
        relationship_description: `Both departments experiencing ${pattern.pattern_type}`,
      });
    }
  }

  return correlations;
}

async function generateKnowledgeArticle(
  supabase: any,
  customerId: string,
  pattern: GlobalInsightPattern,
  lovableApiKey?: string
): Promise<any | null> {
  try {
    if (!lovableApiKey) {
      console.log('[Central MML] No AI key available, skipping article generation');
      return null;
    }

    const prompt = `Generate a concise knowledge base article based on this organizational pattern:

Pattern Type: ${pattern.pattern_type}
Affected Departments: ${pattern.affected_departments.join(', ')}
Frequency: ${pattern.frequency} occurrences
Common Themes: ${pattern.insight_data.common_themes?.join(', ') || 'N/A'}

Create an article with:
1. Clear title (max 100 chars)
2. Problem description
3. Step-by-step solution
4. Best practices

Format as JSON: { "title": "...", "content": "..." }`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a knowledge management AI. Generate clear, actionable documentation.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('[Central MML] AI API error:', await aiResponse.text());
      return null;
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content;

    if (!generatedText) {
      return null;
    }

    // Parse AI response
    const articleData = JSON.parse(generatedText);

    // Create knowledge article
    const { data: article, error } = await supabase
      .from('knowledge_articles')
      .insert({
        customer_id: customerId,
        title: articleData.title.substring(0, 200),
        content: articleData.content,
        category: pattern.pattern_type,
        tags: pattern.insight_data.common_themes || [],
        is_published: true,
        auto_generated: true,
        source_metadata: {
          generated_by: 'central_mml_processor',
          pattern_type: pattern.pattern_type,
          departments: pattern.affected_departments,
        },
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Central MML] Error creating article:', error);
      return null;
    }

    return article;

  } catch (error) {
    console.error('[Central MML] Error generating article:', error);
    return null;
  }
}

async function createInsightFeedback(
  supabase: any,
  customerId: string,
  globalInsight: any,
  pattern: GlobalInsightPattern
): Promise<void> {
  try {
    // Create feedback for each affected department
    for (const department of pattern.affected_departments) {
      await supabase
        .from('insight_feedback')
        .insert({
          customer_id: customerId,
          global_insight_id: globalInsight.id,
          target_department: department,
          feedback_type: 'proactive_recommendation',
          feedback_data: {
            recommendation: `Organization-wide pattern detected: ${pattern.pattern_type}`,
            suggested_actions: pattern.recommended_actions,
            other_departments: pattern.affected_departments.filter(d => d !== department),
            confidence: pattern.confidence_score,
          },
          priority: pattern.confidence_score > 0.8 ? 'high' : 'medium',
        });
    }

    console.log(`[Central MML] Created feedback for ${pattern.affected_departments.length} departments`);

  } catch (error) {
    console.error('[Central MML] Error creating feedback:', error);
  }
}
