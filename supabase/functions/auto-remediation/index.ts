import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

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

    const requestData = await req.json();
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const action = String(requestData.action || '').slice(0, 100);
    const incidentId = requestData.incidentId;
    const ruleId = requestData.ruleId;
    const customerId = requestData.customerId;
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'detect_incident': {
        const title = String(requestData.title || '').slice(0, 200);
        const description = String(requestData.description || '').slice(0, 2000);
        const severity = String(requestData.severity || '').slice(0, 50);
        const incidentType = String(requestData.incidentType || '').slice(0, 100);
        const affectedCiIds = requestData.affectedCiIds;
        const detectionMethod = String(requestData.detectionMethod || '').slice(0, 100);
        
        if (!customerId || !title || !severity || !incidentType) {
          return new Response(
            JSON.stringify({ error: 'Required fields missing' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Create incident
        const { data: incident, error: incidentError } = await supabase
          .from('incidents')
          .insert({
            customer_id: customerId,
            title,
            description,
            severity,
            incident_type: incidentType,
            affected_ci_ids: affectedCiIds || [],
            detection_method: detectionMethod,
            created_by: customerId
          })
          .select()
          .maybeSingle();

        if (incidentError) throw incidentError;

        // Check for matching remediation rules
        const { data: rules } = await supabase
          .from('remediation_rules')
          .select('*')
          .eq('customer_id', customerId)
          .eq('is_active', true);

        let autoRemediated = false;
        if (rules && rules.length > 0) {
          // Find matching rule
          const matchingRule = rules.find(rule => {
            const pattern = rule.incident_pattern;
            return pattern.type === incidentType && 
                   pattern.severity === severity;
          });

          if (matchingRule && matchingRule.auto_execute) {
            // Execute auto-remediation
            const actions = matchingRule.remediation_actions;
            const startTime = Date.now();
            
            try {
              // Simulate remediation actions
              console.log('Executing remediation actions:', actions);
              
              const { error: execError } = await supabase
                .from('remediation_executions')
                .insert({
                  customer_id: customerId,
                  incident_id: incident.id,
                  rule_id: matchingRule.id,
                  execution_type: 'automatic',
                  actions_taken: actions,
                  success: true,
                  execution_duration_ms: Date.now() - startTime
                });

              if (!execError) {
                autoRemediated = true;
                
                // Update incident
                await supabase
                  .from('incidents')
                  .update({
                    status: 'resolved',
                    auto_remediated: true,
                    remediation_applied: matchingRule.rule_name,
                    resolved_at: new Date().toISOString()
                  })
                  .eq('id', incident.id);

                // Update rule statistics
                await supabase
                  .from('remediation_rules')
                  .update({
                    execution_count: matchingRule.execution_count + 1,
                    last_executed_at: new Date().toISOString()
                  })
                  .eq('id', matchingRule.id);
              }
            } catch (error) {
              console.error('Remediation execution failed:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              await supabase
                .from('remediation_executions')
                .insert({
                  customer_id: customerId,
                  incident_id: incident.id,
                  rule_id: matchingRule.id,
                  execution_type: 'automatic',
                  actions_taken: actions,
                  success: false,
                  error_message: errorMessage,
                  execution_duration_ms: Date.now() - startTime
                });
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, incident, autoRemediated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'execute_remediation': {
        const executionType = String(requestData.executionType || 'manual').slice(0, 50);
        
        if (!incidentId || !ruleId) {
          return new Response(
            JSON.stringify({ error: 'Incident ID and rule ID are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: incident } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', incidentId)
          .maybeSingle();

        const { data: rule } = await supabase
          .from('remediation_rules')
          .select('*')
          .eq('id', ruleId)
          .maybeSingle();

        if (!incident || !rule) {
          throw new Error('Incident or rule not found');
        }

        const startTime = Date.now();
        const actions = rule.remediation_actions;

        try {
          // Execute remediation actions
          console.log('Executing remediation:', actions);

          const { error: execError } = await supabase
            .from('remediation_executions')
            .insert({
              customer_id: customerId,
              incident_id: incidentId,
              rule_id: ruleId,
              execution_type: executionType,
              actions_taken: actions,
              success: true,
              execution_duration_ms: Date.now() - startTime
            });

          if (execError) throw execError;

          // Update incident
          await supabase
            .from('incidents')
            .update({
              status: 'resolved',
              auto_remediated: executionType === 'automatic',
              remediation_applied: rule.rule_name,
              resolved_at: new Date().toISOString(),
              resolution_time_minutes: Math.floor((Date.now() - new Date(incident.detected_at).getTime()) / 60000)
            })
            .eq('id', incidentId);

          return new Response(
            JSON.stringify({ success: true, message: 'Remediation executed successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await supabase
            .from('remediation_executions')
            .insert({
              customer_id: customerId,
              incident_id: incidentId,
              rule_id: ruleId,
              execution_type: executionType,
              actions_taken: actions,
              success: false,
              error_message: errorMessage,
              execution_duration_ms: Date.now() - startTime
            });

          throw error;
        }
      }

      case 'analyze_incidents': {
        // Get recent incidents for pattern analysis
        const { data: incidents } = await supabase
          .from('incidents')
          .select('*')
          .eq('customer_id', customerId)
          .order('detected_at', { ascending: false })
          .limit(100);

        // Analyze patterns
        const patterns = {
          byType: {} as Record<string, number>,
          bySeverity: {} as Record<string, number>,
          avgResolutionTime: 0,
          autoRemediationRate: 0
        };

        incidents?.forEach(inc => {
          patterns.byType[inc.incident_type] = (patterns.byType[inc.incident_type] || 0) + 1;
          patterns.bySeverity[inc.severity] = (patterns.bySeverity[inc.severity] || 0) + 1;
        });

        const resolvedIncidents = incidents?.filter(i => i.resolved_at) || [];
        if (resolvedIncidents.length > 0) {
          const totalTime = resolvedIncidents.reduce((sum, inc) => 
            sum + (inc.resolution_time_minutes || 0), 0);
          patterns.avgResolutionTime = totalTime / resolvedIncidents.length;
          
          const autoRemediated = resolvedIncidents.filter(i => i.auto_remediated).length;
          patterns.autoRemediationRate = (autoRemediated / resolvedIncidents.length) * 100;
        }

        return new Response(
          JSON.stringify({ success: true, patterns }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Auto-remediation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
