import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, aeg-subscription-name, aeg-event-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const eventType = req.headers.get('aeg-event-type');

    // Handle Event Grid subscription validation
    if (eventType === 'SubscriptionValidation') {
      const events = await req.json();
      const validationCode = events[0]?.data?.validationCode;
      
      if (validationCode) {
        console.log('Event Grid subscription validation:', validationCode);
        return new Response(
          JSON.stringify({ validationResponse: validationCode }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
    }

    // Handle actual Azure Activity Log events
    const events = await req.json();
    console.log('Received Azure events:', events.length);

    const createdChanges = [];

    for (const event of events) {
      try {
        // Parse Azure Activity Log event
        const data = event.data;
        const operationName = data.operationName;
        const resourceType = extractResourceType(operationName);
        const resourceName = data.resourceId?.split('/').pop() || 'Unknown Resource';
        const caller = data.caller || data.claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'] || 'System';
        const status = data.status?.value || data.status || 'Unknown';
        const timestamp = event.eventTime || new Date().toISOString();

        // Only log successful write operations
        if (!operationName.toLowerCase().includes('write') && 
            !operationName.toLowerCase().includes('delete') && 
            !operationName.toLowerCase().includes('action')) {
          continue;
        }

        if (status !== 'Succeeded' && status !== 'Success') {
          continue;
        }

        // Find matching template and scenario
        const { templateId, scenarioId, category } = await findMatchingTemplate(
          supabaseClient,
          resourceType,
          operationName
        );

        if (!templateId) {
          console.log('No matching template found for:', operationName);
          continue;
        }

        // Get customer_id from Azure subscription mapping (you'd set this up)
        // For now, we'll use the first customer that has the template
        const { data: template } = await supabaseClient
          .from('change_request_templates')
          .select('customer_id')
          .eq('id', templateId)
          .single();

        if (!template) continue;

        // Create automatic change request
        const changeRequest = {
          customer_id: template.customer_id,
          title: `[AUTO] ${resourceType}: ${resourceName}`,
          description: `Automatically logged Azure change\n\nOperation: ${operationName}\nResource: ${resourceName}\nResource Type: ${resourceType}\nPerformed by: ${caller}\nStatus: ${status}\nTimestamp: ${timestamp}`,
          change_type: 'normal' as const,
          priority: 'low' as const,
          change_status: 'completed' as const,
          justification: 'Azure infrastructure change detected via Event Grid',
          implementation_plan: `Azure Activity Log:\n${JSON.stringify(data, null, 2)}`,
          rollback_plan: 'Manual rollback required - refer to Azure backup/snapshot',
          testing_plan: 'N/A - Reactive logging',
          business_impact: 'Automatically detected change',
          technical_impact: `Azure resource modified: ${resourceType}`,
          requested_by: '00000000-0000-0000-0000-000000000000', // System user
          template_id: templateId,
          selected_scenario_id: scenarioId,
          completed_at: timestamp,
          compliance_tags: ['azure', 'automated', resourceType.toLowerCase()],
        };

        const { data: createdChange, error: createError } = await supabaseClient
          .from('change_requests')
          .insert(changeRequest)
          .select()
          .single();

        if (createError) {
          console.error('Error creating change request:', createError);
          continue;
        }

        createdChanges.push(createdChange);
        console.log('Created automatic change request:', createdChange.change_number);

      } catch (error) {
        console.error('Error processing event:', error);
        // Continue processing other events
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: events.length,
        created: createdChanges.length,
        changes: createdChanges.map(c => c.change_number)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function extractResourceType(operationName: string): string {
  // Extract resource type from operation name
  // Example: "Microsoft.Compute/virtualMachines/write" -> "Virtual Machine"
  const parts = operationName.split('/');
  if (parts.length < 2) return 'Azure Resource';
  
  const resourceType = parts[1];
  
  // Map to friendly names
  const typeMap: Record<string, string> = {
    'virtualMachines': 'Virtual Machine',
    'virtualNetworks': 'Virtual Network',
    'networkSecurityGroups': 'Network Security Group',
    'storageAccounts': 'Storage Account',
    'applications': 'App Registration',
    'servicePrincipals': 'Service Principal',
    'loadBalancers': 'Load Balancer',
    'publicIPAddresses': 'Public IP Address',
    'networkInterfaces': 'Network Interface',
    'disks': 'Disk',
    'snapshots': 'Snapshot',
  };
  
  return typeMap[resourceType] || resourceType;
}

async function findMatchingTemplate(
  supabase: any,
  resourceType: string,
  operationName: string
): Promise<{ templateId: string | null; scenarioId: string | null; category: string }> {
  // Find Azure Infrastructure template
  const { data: template } = await supabase
    .from('change_request_templates')
    .select('id, customer_id')
    .eq('category', 'azure_infrastructure')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!template) {
    return { templateId: null, scenarioId: null, category: '' };
  }

  // Match scenario based on resource type
  const scenarioMap: Record<string, string> = {
    'Virtual Machine': 'Virtual Machine Deployment/Modification',
    'Virtual Network': 'Network Configuration (VNets, NSGs, Firewalls)',
    'Network Security Group': 'Network Configuration (VNets, NSGs, Firewalls)',
    'Storage Account': 'Storage Account Changes',
    'App Registration': 'App Registration & Service Principal',
    'Service Principal': 'App Registration & Service Principal',
  };

  const scenarioName = scenarioMap[resourceType];
  
  if (scenarioName) {
    const { data: scenario } = await supabase
      .from('change_request_template_scenarios')
      .select('id')
      .eq('template_id', template.id)
      .eq('scenario_name', scenarioName)
      .single();
    
    if (scenario) {
      return {
        templateId: template.id,
        scenarioId: scenario.id,
        category: 'azure_infrastructure'
      };
    }
  }

  return {
    templateId: template.id,
    scenarioId: null,
    category: 'azure_infrastructure'
  };
}