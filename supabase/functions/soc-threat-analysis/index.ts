import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const analysisType = requestData.analysisType ? String(requestData.analysisType).slice(0, 50) : undefined;
    const timeframe = requestData.timeframe ? String(requestData.timeframe).slice(0, 10) : '24h';
    
    if (!['1h', '24h', '7d', '30d'].includes(timeframe)) {
      return new Response(JSON.stringify({ error: 'Invalid timeframe. Must be 1h, 24h, 7d, or 30d' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get customer_id from user profile
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      return new Response(JSON.stringify({ error: 'No customer profile found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customerId = profile.customer_id;

    // Calculate time range
    const timeMap: Record<string, string> = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
    };
    const interval = timeMap[timeframe] || '24 hours';

    // Gather security intelligence data
    const [
      failedLogins,
      anomalies,
      lateralMovement,
      dataAnomalies,
      threatIndicators,
      attackChains,
      honeypotTriggers,
      behavioralDeviations
    ] = await Promise.all([
      supabaseClient
        .from('failed_login_attempts')
        .select('*')
        .eq('customer_id', customerId)
        .gte('attempted_at', `now() - interval '${interval}'`)
        .order('attempted_at', { ascending: false })
        .limit(100),
      
      supabaseClient
        .from('anomaly_detections')
        .select('*')
        .eq('customer_id', customerId)
        .gte('created_at', `now() - interval '${interval}'`)
        .in('severity', ['high', 'critical'])
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabaseClient
        .from('lateral_movement_indicators')
        .select('*')
        .eq('customer_id', customerId)
        .gte('triggered_at', `now() - interval '${interval}'`)
        .gte('risk_score', 50)
        .order('risk_score', { ascending: false })
        .limit(50),
      
      supabaseClient
        .from('data_access_anomalies')
        .select('*')
        .eq('customer_id', customerId)
        .gte('flagged_at', `now() - interval '${interval}'`)
        .order('deviation_percentage', { ascending: false })
        .limit(50),
      
      supabaseClient
        .from('threat_indicators')
        .select('*')
        .eq('customer_id', customerId)
        .in('threat_level', ['high', 'critical'])
        .order('last_seen', { ascending: false })
        .limit(20),
      
      supabaseClient
        .from('attack_chain_events')
        .select('*')
        .eq('customer_id', customerId)
        .gte('detected_at', `now() - interval '${interval}'`)
        .order('detected_at', { ascending: false })
        .limit(50),
      
      supabaseClient
        .from('honeypot_access_log')
        .select('*, honeypot_resources(*)')
        .eq('customer_id', customerId)
        .gte('accessed_at', `now() - interval '${interval}'`)
        .order('accessed_at', { ascending: false })
        .limit(30),
      
      supabaseClient
        .from('behavioral_deviations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('was_investigated', false)
        .in('risk_level', ['high', 'critical'])
        .order('detected_at', { ascending: false })
        .limit(30)
    ]);

    // Prepare context for AI analysis
    const securityContext = {
      timeframe: interval,
      stats: {
        failedLogins: failedLogins.data?.length || 0,
        highRiskAnomalies: anomalies.data?.length || 0,
        lateralMovement: lateralMovement.data?.length || 0,
        dataAnomalies: dataAnomalies.data?.length || 0,
        activeThreat: threatIndicators.data?.length || 0,
        attackChains: attackChains.data?.length || 0,
        honeypotTriggers: honeypotTriggers.data?.length || 0,
        behavioralDeviations: behavioralDeviations.data?.length || 0,
      },
      recentEvents: {
        topFailedLoginIPs: getTopIPs(failedLogins.data || []),
        criticalAnomalies: anomalies.data?.slice(0, 5) || [],
        highRiskLateralMovement: lateralMovement.data?.slice(0, 5) || [],
        suspiciousDataAccess: dataAnomalies.data?.slice(0, 5) || [],
        activeThreats: threatIndicators.data || [],
        attackChainStages: summarizeAttackChains(attackChains.data || []),
        honeypotHits: honeypotTriggers.data?.length || 0,
      }
    };

    // Call Lovable AI for threat analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a cybersecurity analyst assistant for an SOC (Security Operations Center). 
Analyze the provided security telemetry and provide actionable threat intelligence.

Your analysis should include:
1. **Threat Summary**: Overall security posture and key concerns
2. **Attack Patterns**: Identify potential attack campaigns or patterns
3. **Priority Actions**: Top 3-5 immediate actions SOC should take
4. **Risk Assessment**: Overall risk level (Low/Medium/High/Critical) with justification
5. **Indicators of Compromise**: Any IOCs detected
6. **Recommendations**: Short-term and long-term security improvements

Be concise, actionable, and prioritize by severity.`;

    const userPrompt = `Analyze this security data from the last ${interval}:

**Statistics:**
${JSON.stringify(securityContext.stats, null, 2)}

**Key Events:**
${JSON.stringify(securityContext.recentEvents, null, 2)}

Provide a comprehensive threat analysis.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent security analysis
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'AI analysis failed',
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await aiResponse.json();
    const analysis = aiResult.choices?.[0]?.message?.content || 'No analysis available';

    return new Response(JSON.stringify({
      analysis,
      securityContext,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in soc-threat-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getTopIPs(attempts: any[]): { ip: string; count: number }[] {
  const ipCounts: Record<string, number> = {};
  attempts.forEach(attempt => {
    const ip = attempt.ip_address;
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
  });
  return Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function summarizeAttackChains(events: any[]): Record<string, number> {
  const stageCounts: Record<string, number> = {};
  events.forEach(event => {
    const stage = event.stage;
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  });
  return stageCounts;
}
