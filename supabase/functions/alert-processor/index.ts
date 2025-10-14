import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      customerId, 
      alertData, 
      sourceSystem, 
      enrichment = true,
      autoResponse = true 
    } = await req.json();

    console.log(`Processing alert from ${sourceSystem} for customer ${customerId}`);

    // 1. Enrich alert with threat intelligence
    let enrichedAlert = { ...alertData };
    let matchedIndicators = [];

    if (enrichment) {
      const enrichmentResult = await enrichAlertWithThreatIntel(
        supabase, 
        customerId, 
        alertData
      );
      enrichedAlert = enrichmentResult.alert;
      matchedIndicators = enrichmentResult.indicators;
    }

    // 2. Calculate severity and confidence
    const analysis = await analyzeAlert(supabase, customerId, enrichedAlert);

    // 3. Insert alert into database
    const { data: alert, error: insertError } = await supabase
      .from('security_alerts')
      .insert({
        customer_id: customerId,
        alert_id: alertData.id || generateAlertId(),
        alert_name: enrichedAlert.name,
        alert_type: enrichedAlert.type,
        severity: analysis.severity,
        source_system: sourceSystem,
        detection_method: alertData.detection_method || 'rule_based',
        affected_entities: enrichedAlert.affected_entities,
        indicators: matchedIndicators,
        confidence_score: analysis.confidence,
        raw_log: alertData.raw_log,
        alert_details: enrichedAlert,
        compliance_tags: enrichedAlert.compliance_tags || []
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log(`Alert created: ${alert.id}`);

    // 4. Check if alert should trigger automated response
    if (autoResponse && analysis.severity in ['critical', 'high']) {
      await triggerPlaybookIfMatches(supabase, alert);
    }

    // 5. Check if alert should be escalated to incident
    if (shouldEscalateToIncident(analysis)) {
      await createIncidentFromAlert(supabase, alert, analysis);
    }

    // 6. Update threat intel match counts
    if (matchedIndicators.length > 0) {
      for (const indicator of matchedIndicators) {
        // Increment match count using RPC or fetch current and update
        const { data: currentIndicator } = await supabase
          .from('threat_intel_indicators')
          .select('matched_count')
          .eq('id', indicator.id)
          .single();
        
        await supabase
          .from('threat_intel_indicators')
          .update({
            matched_count: (currentIndicator?.matched_count || 0) + 1,
            last_matched: new Date().toISOString()
          })
          .eq('id', indicator.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alert_id: alert.id,
        severity: analysis.severity,
        matched_indicators: matchedIndicators.length,
        playbook_triggered: false // will be updated in real implementation
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing alert:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function enrichAlertWithThreatIntel(supabase: any, customerId: string, alertData: any) {
  const matchedIndicators = [];
  
  // Extract IOCs from alert
  const iocs = extractIOCs(alertData);
  
  for (const ioc of iocs) {
    const { data: indicators } = await supabase
      .from('threat_intel_indicators')
      .select('*')
      .eq('customer_id', customerId)
      .eq('indicator_value', ioc.value)
      .eq('is_active', true);

    if (indicators && indicators.length > 0) {
      matchedIndicators.push(...indicators);
    }
  }

  // Enhance alert with matched threat intel
  const enrichedAlert = {
    ...alertData,
    threat_intel_matches: matchedIndicators.length,
    known_threat: matchedIndicators.length > 0,
    threat_campaigns: [...new Set(matchedIndicators.flatMap(i => i.related_campaigns || []))]
  };

  return { alert: enrichedAlert, indicators: matchedIndicators };
}

function extractIOCs(alertData: any): Array<{type: string, value: string}> {
  const iocs = [];
  
  // Extract IPs
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const ips = JSON.stringify(alertData).match(ipRegex) || [];
  iocs.push(...ips.map(ip => ({ type: 'ip', value: ip })));

  // Extract domains
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi;
  const domains = JSON.stringify(alertData).match(domainRegex) || [];
  iocs.push(...domains.map(domain => ({ type: 'domain', value: domain })));

  // Extract hashes (MD5, SHA1, SHA256)
  const hashRegex = /\b[a-f0-9]{32,64}\b/gi;
  const hashes = JSON.stringify(alertData).match(hashRegex) || [];
  iocs.push(...hashes.map(hash => ({ type: 'file_hash', value: hash })));

  return iocs;
}

async function analyzeAlert(supabase: any, customerId: string, alertData: any) {
  let severity = alertData.severity || 'medium';
  let confidence = alertData.confidence || 50;

  // Increase severity if known threats detected
  if (alertData.known_threat) {
    if (severity === 'medium') severity = 'high';
    else if (severity === 'low') severity = 'medium';
    confidence = Math.min(confidence + 30, 100);
  }

  // Check for attack patterns
  if (alertData.attack_pattern) {
    severity = 'high';
    confidence = Math.min(confidence + 20, 100);
  }

  // Check historical context
  const { count } = await supabase
    .from('security_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .eq('alert_type', alertData.type);

  // Multiple similar alerts in short time = higher severity
  if (count > 5) {
    if (severity === 'medium') severity = 'high';
    else if (severity === 'low') severity = 'medium';
  }

  return { severity, confidence };
}

async function triggerPlaybookIfMatches(supabase: any, alert: any) {
  const { data: playbooks } = await supabase
    .from('response_playbooks')
    .select('*')
    .eq('customer_id', alert.customer_id)
    .eq('is_active', true)
    .contains('alert_types', [alert.alert_type]);

  for (const playbook of playbooks || []) {
    // Check if trigger conditions match
    const conditions = playbook.trigger_conditions;
    
    if (matchesConditions(alert, conditions)) {
      console.log(`Triggering playbook: ${playbook.playbook_name}`);
      
      // Create playbook execution
      await supabase
        .from('playbook_executions')
        .insert({
          customer_id: alert.customer_id,
          playbook_id: playbook.id,
          alert_id: alert.id,
          execution_status: playbook.automation_level === 'fully_automated' ? 'running' : 'pending',
          trigger_type: 'automated',
          started_at: new Date().toISOString(),
          total_steps: playbook.steps?.length || 0
        });

      // Update alert with playbook reference
      await supabase
        .from('security_alerts')
        .update({ playbook_id: playbook.id })
        .eq('id', alert.id);
    }
  }
}

function matchesConditions(alert: any, conditions: any): boolean {
  if (!conditions) return false;
  
  // Check severity threshold
  if (conditions.severity_threshold) {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const alertSeverityIndex = severityOrder.indexOf(alert.severity);
    const thresholdIndex = severityOrder.indexOf(conditions.severity_threshold);
    
    if (alertSeverityIndex < thresholdIndex) return false;
  }

  // Check confidence threshold
  if (conditions.confidence_threshold && alert.confidence_score < conditions.confidence_threshold) {
    return false;
  }

  return true;
}

function shouldEscalateToIncident(analysis: any): boolean {
  return analysis.severity === 'critical' && analysis.confidence >= 80;
}

async function createIncidentFromAlert(supabase: any, alert: any, analysis: any) {
  const { data: incident } = await supabase
    .from('security_incidents')
    .insert({
      customer_id: alert.customer_id,
      incident_name: `Auto-escalated: ${alert.alert_name}`,
      incident_type: mapAlertTypeToIncidentType(alert.alert_type),
      severity: alert.severity,
      description: `Automatically escalated from alert ${alert.alert_id}`,
      initial_detection_time: alert.created_at,
      related_alerts: [alert.id],
      affected_systems: alert.affected_entities?.systems || [],
      affected_users: alert.affected_entities?.users || [],
      reported_by: alert.acknowledged_by
    })
    .select()
    .single();

  if (incident) {
    // Link alert to incident
    await supabase
      .from('security_alerts')
      .update({ 
        incident_id: incident.id,
        status: 'escalated'
      })
      .eq('id', alert.id);

    console.log(`Created incident ${incident.incident_number} from alert ${alert.alert_id}`);
  }
}

function mapAlertTypeToIncidentType(alertType: string): string {
  const typeMap: Record<string, string> = {
    'malware': 'malware',
    'network': 'unauthorized_access',
    'endpoint': 'malware',
    'identity': 'unauthorized_access',
    'data_loss': 'data_breach',
    'phishing': 'phishing'
  };
  return typeMap[alertType] || 'unauthorized_access';
}

function generateAlertId(): string {
  return 'ALT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}