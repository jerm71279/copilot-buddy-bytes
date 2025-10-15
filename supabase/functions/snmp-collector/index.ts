import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SnmpTrap {
  sourceIp: string;
  trapOid: string;
  trapType?: string;
  varbinds?: Array<{ oid: string; value: any; type: string }>;
  customerId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData = await req.json();
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const sourceIp = String(requestData.sourceIp || '').slice(0, 100);
    const trapOid = String(requestData.trapOid || '').slice(0, 200);
    const trapType = requestData.trapType ? String(requestData.trapType).slice(0, 100) : undefined;
    const varbinds = Array.isArray(requestData.varbinds) ? requestData.varbinds.slice(0, 100) : undefined;
    const providedCustomerId = requestData.customerId ? String(requestData.customerId).slice(0, 100) : undefined;
    
    if (!sourceIp || !trapOid) {
      return new Response(
        JSON.stringify({ error: 'sourceIp and trapOid are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const trapData: SnmpTrap = {
      sourceIp,
      trapOid,
      trapType,
      varbinds,
      customerId: providedCustomerId
    };
    
    console.log('Received SNMP trap:', trapData);

    // Determine severity based on trap type
    let severity = 'info';
    if (trapData.trapType === 'linkDown' || trapData.trapType === 'authenticationFailure') {
      severity = 'warning';
    } else if (trapData.trapType === 'enterpriseSpecific') {
      severity = 'critical';
    }

    // Find matching device by IP
    const { data: device } = await supabase
      .from('network_devices')
      .select('id, customer_id')
      .eq('ip_address', trapData.sourceIp)
      .maybeSingle();

    const customerId = device?.customer_id || trapData.customerId;
    if (!customerId) {
      console.error('No customer ID found for trap from', trapData.sourceIp);
      return new Response(
        JSON.stringify({ error: 'Customer ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store trap
    const { data: trap, error: trapError } = await supabase
      .from('snmp_traps')
      .insert({
        customer_id: customerId,
        device_id: device?.id,
        source_ip: trapData.sourceIp,
        trap_oid: trapData.trapOid,
        trap_type: trapData.trapType,
        severity,
        varbinds: trapData.varbinds || [],
        raw_data: trapData,
      })
      .select()
      .maybeSingle();
    
    if (!trap) {
      throw new Error('Failed to store SNMP trap');
    }

    if (trapError) throw trapError;

    // Check if trap matches any alert rules
    const { data: rules } = await supabase
      .from('network_alert_rules')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_enabled', true)
      .eq('rule_type', 'snmp_trap');

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        const conditions = rule.conditions as any;
        
        // Check if trap matches rule conditions
        let matches = false;
        if (conditions.trapOid && trapData.trapOid.includes(conditions.trapOid)) {
          matches = true;
        }
        if (conditions.trapType && trapData.trapType === conditions.trapType) {
          matches = true;
        }

        if (matches) {
          // Create network alert
          await supabase.from('network_alerts').insert({
            customer_id: customerId,
            device_id: device?.id,
            alert_type: 'snmp_trap',
            severity: rule.severity,
            title: `SNMP Trap: ${trapData.trapType || 'Unknown'}`,
            description: `Received ${trapData.trapType} trap from ${trapData.sourceIp}`,
            source_data: { trap_id: trap.id, trap_data: trapData },
          });

          console.log('Created alert for trap matching rule:', rule.rule_name);
        }
      }
    }

    // Update device last_poll_at
    if (device?.id) {
      await supabase
        .from('network_devices')
        .update({ last_poll_at: new Date().toISOString() })
        .eq('id', device.id);
    }

    return new Response(
      JSON.stringify({ success: true, trap_id: trap.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing SNMP trap:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});