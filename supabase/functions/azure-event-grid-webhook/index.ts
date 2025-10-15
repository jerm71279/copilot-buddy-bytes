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
      
      // Validate validation code
      if (validationCode && typeof validationCode === 'string' && validationCode.length < 200) {
        console.log('Event Grid subscription validation');
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
    const requestData = await req.json();
    
    // Enhanced validation for request body
    if (!requestData) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const events = Array.isArray(requestData) ? requestData : [requestData];
    
    // Validate batch size
    if (events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No events provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (events.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Batch size exceeds maximum of 100 events' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Limit batch size
    if (events.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Too many events: maximum 100 per request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Received Azure events:', events.length);

    const createdChanges = [];

    for (const event of events) {
      try {
        // Parse Azure Activity Log event
        const data = event.data;
        
        // Validate required fields
        if (!data || typeof data !== 'object') {
          console.error('Invalid event data structure');
          continue;
        }
        
        const operationName = String(data.operationName || '').slice(0, 200);
        if (!operationName) {
          console.error('Missing operationName');
          continue;
        }
        
        const resourceType = extractResourceType(operationName);
        const rawResourceName = data.resourceId?.split('/').pop() || 'Unknown Resource';
        const resourceName = String(rawResourceName).slice(0, 100);
        
        const rawCaller = data.caller || data.claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'] || 'System';
        const caller = String(rawCaller).slice(0, 200);
        
        const rawStatus = data.status?.value || data.status || 'Unknown';
        const status = String(rawStatus).slice(0, 50);
        
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

        // Get customer_id from Azure subscription mapping
        const { data: template } = await supabaseClient
          .from('change_request_templates')
          .select('customer_id')
          .eq('id', templateId)
          .maybeSingle();

        if (!template) {
          console.log('Template not found for id:', templateId);
          continue;
        }

        // Search for matching planned change request
        const relatedChangeId = await findRelatedPlannedChange(
          supabaseClient,
          template.customer_id,
          resourceName,
          resourceType,
          templateId
        );

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
          related_change_id: relatedChangeId,
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

        // If linked to planned change, update the planned change status
        if (relatedChangeId) {
          await supabaseClient
            .from('change_requests')
            .update({
              change_status: 'completed',
              actual_start_time: timestamp,
              actual_end_time: timestamp,
              completion_notes: `Automatically completed. Actual Azure change logged as ${createdChange.change_number}`
            })
            .eq('id', relatedChangeId);
          
          console.log('Linked and completed planned change:', relatedChangeId);
        }

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
    .maybeSingle();

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
      .maybeSingle();
    
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

async function findRelatedPlannedChange(
  supabase: any,
  customerId: string,
  resourceName: string,
  resourceType: string,
  templateId: string
): Promise<string | null> {
  try {
    // Search for open/approved change requests that might match this resource
    // Look for changes in last 30 days that mention this resource
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: changes } = await supabase
      .from('change_requests')
      .select('id, title, description, change_status, scheduled_start_time')
      .eq('customer_id', customerId)
      .eq('template_id', templateId)
      .in('change_status', ['approved', 'scheduled', 'in_progress'])
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!changes || changes.length === 0) return null;

    // Try to match based on resource name or type in title/description
    const matchingChange = changes.find((change: any) => {
      const searchText = `${change.title} ${change.description}`.toLowerCase();
      return searchText.includes(resourceName.toLowerCase()) || 
             searchText.includes(resourceType.toLowerCase());
    });

    if (matchingChange) {
      console.log('Found matching planned change:', matchingChange.id);
      return matchingChange.id;
    }

    // If no specific match, link to most recent approved change for same template
    // This handles bulk operations where resource name might not match exactly
    const recentChange = changes[0];
    if (recentChange && recentChange.scheduled_start_time) {
      const scheduledDate = new Date(recentChange.scheduled_start_time);
      const now = new Date();
      
      // If scheduled within last 24 hours, likely related
      const hoursDiff = (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);
      if (Math.abs(hoursDiff) <= 24) {
        console.log('Linked to recent scheduled change:', recentChange.id);
        return recentChange.id;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding related change:', error);
    return null;
  }
}