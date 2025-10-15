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
    const supabaseClient = createClient(
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
    
    const customer_id = String(requestData.customer_id || '').slice(0, 100);

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const templates = [
      {
        template_name: 'Azure Infrastructure Changes (Planned)',
        category: 'azure_infrastructure',
        description: 'For PROACTIVE change requests requiring approval BEFORE making Azure changes. Note: Azure Event Grid automatically logs reactive changes after they happen.',
        default_priority: 'medium',
        default_risk_level: 'medium',
        requires_approval: true,
        estimated_duration_minutes: 30,
        scenarios: [
          {
            scenario_name: 'Virtual Machine Deployment/Modification',
            scenario_description: 'PLANNED: Creating new VMs, resizing existing VMs, or modifying VM configurations. Use this for pre-approved changes. Unplanned VM changes are automatically logged by Event Grid.',
            impact_level: 'medium',
            typical_duration_minutes: 45,
            requires_emergency_approval: false,
            compliance_tags: ['infrastructure', 'compute', 'planned'],
            recommended_testing: 'Verify VM accessibility, test network connectivity, confirm resource allocation',
            recommended_rollback: 'Snapshot VM before changes, document original configuration, keep previous VM size settings',
            display_order: 1
          },
          {
            scenario_name: 'Network Configuration (VNets, NSGs, Firewalls)',
            scenario_description: 'PLANNED: Creating or modifying virtual networks, network security groups, or firewall rules requiring approval. Emergency network changes are auto-logged by Event Grid.',
            impact_level: 'high',
            typical_duration_minutes: 30,
            requires_emergency_approval: false,
            compliance_tags: ['networking', 'security', 'planned'],
            recommended_testing: 'Test connectivity from all affected subnets, verify firewall rules with port scans',
            recommended_rollback: 'Export NSG rules before changes, document VNet configuration, keep rule backup',
            display_order: 2
          },
          {
            scenario_name: 'Storage Account Changes',
            scenario_description: 'Creating storage accounts, modifying access policies, or configuring blob/file storage',
            impact_level: 'medium',
            typical_duration_minutes: 20,
            requires_emergency_approval: false,
            compliance_tags: ['storage', 'data'],
            recommended_testing: 'Verify access permissions, test file upload/download, check replication status',
            recommended_rollback: 'Document access keys, backup SAS tokens, note original replication settings',
            display_order: 3
          },
          {
            scenario_name: 'App Registration & Service Principal',
            scenario_description: 'Creating or modifying Azure AD app registrations, service principals, or API permissions',
            impact_level: 'medium',
            typical_duration_minutes: 25,
            requires_emergency_approval: false,
            compliance_tags: ['identity', 'security', 'compliance'],
            recommended_testing: 'Test authentication flow, verify API permissions are granted, check redirect URIs',
            recommended_rollback: 'Save client secret, document original permissions, backup certificate thumbprints',
            display_order: 4
          },
          {
            scenario_name: 'Azure AD / Entra ID Configuration',
            scenario_description: 'Changes to Azure AD tenant settings, custom domains, or identity configurations',
            impact_level: 'high',
            typical_duration_minutes: 40,
            requires_emergency_approval: false,
            compliance_tags: ['identity', 'security', 'compliance'],
            recommended_testing: 'Verify user sign-in flow, test MFA enforcement, confirm conditional access policies',
            recommended_rollback: 'Document original AD settings, backup custom policies, note domain configurations',
            display_order: 5
          }
        ]
      },
      {
        template_name: 'Manual Support & Troubleshooting',
        category: 'manual_support',
        description: 'Hands-on support work, phone calls, and ad-hoc troubleshooting not automatically logged',
        default_priority: 'medium',
        default_risk_level: 'low',
        requires_approval: false,
        estimated_duration_minutes: 20,
        scenarios: [
          {
            scenario_name: 'Phone/Remote Support Session',
            scenario_description: 'Troubleshooting session conducted via phone, Teams, or remote desktop',
            impact_level: 'low',
            typical_duration_minutes: 30,
            requires_emergency_approval: false,
            compliance_tags: ['support', 'documentation'],
            recommended_testing: 'Confirm issue resolution with user, verify system functionality',
            recommended_rollback: 'Document all changes made during session',
            display_order: 1
          },
          {
            scenario_name: 'In-Person Troubleshooting',
            scenario_description: 'On-site support and hands-on device/system troubleshooting',
            impact_level: 'low',
            typical_duration_minutes: 45,
            requires_emergency_approval: false,
            compliance_tags: ['support', 'physical_access'],
            recommended_testing: 'User acceptance test, verify all hardware/software functioning',
            recommended_rollback: 'Document system state before changes',
            display_order: 2
          },
          {
            scenario_name: 'Emergency Password Reset',
            scenario_description: 'Urgent password reset outside normal workflow (verbal approval, emergency access)',
            impact_level: 'medium',
            typical_duration_minutes: 10,
            requires_emergency_approval: true,
            compliance_tags: ['security', 'identity', 'emergency'],
            recommended_testing: 'Verify user can log in with new credentials, check MFA still works',
            recommended_rollback: 'N/A - password changes are one-way',
            display_order: 3
          },
          {
            scenario_name: 'Ad-hoc Configuration Change',
            scenario_description: 'Quick configuration adjustment made without formal change request',
            impact_level: 'medium',
            typical_duration_minutes: 15,
            requires_emergency_approval: false,
            compliance_tags: ['configuration', 'documentation'],
            recommended_testing: 'Verify configuration change achieved desired result',
            recommended_rollback: 'Document original configuration values',
            display_order: 4
          },
          {
            scenario_name: 'Vendor Coordination Call',
            scenario_description: 'Phone call or meeting with vendor to coordinate support or changes',
            impact_level: 'low',
            typical_duration_minutes: 30,
            requires_emergency_approval: false,
            compliance_tags: ['vendor', 'coordination'],
            recommended_testing: 'N/A - coordination activity',
            recommended_rollback: 'N/A - communication activity',
            display_order: 5
          }
        ]
      },
      {
        template_name: 'External Tool Management',
        category: 'external_tools',
        description: 'Work performed in non-integrated third-party tools (AWS, GCP, SaaS platforms, etc.)',
        default_priority: 'medium',
        default_risk_level: 'medium',
        requires_approval: true,
        estimated_duration_minutes: 25,
        scenarios: [
          {
            scenario_name: 'AWS Resource Changes',
            scenario_description: 'Creating or modifying AWS resources (EC2, S3, RDS, Lambda, etc.)',
            impact_level: 'medium',
            typical_duration_minutes: 35,
            requires_emergency_approval: false,
            compliance_tags: ['aws', 'cloud_infrastructure'],
            recommended_testing: 'Verify resource accessibility, test functionality, check billing impact',
            recommended_rollback: 'Use CloudFormation templates, enable versioning, document resource IDs',
            display_order: 1
          },
          {
            scenario_name: 'Google Cloud Platform (GCP) Changes',
            scenario_description: 'GCP project modifications, Compute Engine, Cloud Storage, or other GCP services',
            impact_level: 'medium',
            typical_duration_minutes: 30,
            requires_emergency_approval: false,
            compliance_tags: ['gcp', 'cloud_infrastructure'],
            recommended_testing: 'Test service connectivity, verify IAM permissions, check quotas',
            recommended_rollback: 'Export configurations, enable versioning, use deployment manager',
            display_order: 2
          },
          {
            scenario_name: 'Third-Party SaaS Configuration',
            scenario_description: 'Changes in external SaaS platforms (Salesforce, Zendesk, Slack, etc.)',
            impact_level: 'low',
            typical_duration_minutes: 20,
            requires_emergency_approval: false,
            compliance_tags: ['saas', 'integration'],
            recommended_testing: 'Verify integration still works, test user access, confirm data sync',
            recommended_rollback: 'Screenshot original settings, export configuration if possible',
            display_order: 3
          },
          {
            scenario_name: 'Password Manager Updates',
            scenario_description: 'Updates to shared credentials in password manager (1Password, LastPass, etc.)',
            impact_level: 'low',
            typical_duration_minutes: 10,
            requires_emergency_approval: false,
            compliance_tags: ['security', 'credentials'],
            recommended_testing: 'Verify new credentials work, confirm shared access still functional',
            recommended_rollback: 'Keep previous password in history, document rotation date',
            display_order: 4
          },
          {
            scenario_name: 'External Documentation Updates',
            scenario_description: 'Updates to documentation stored in external systems (Confluence, SharePoint, etc.)',
            impact_level: 'low',
            typical_duration_minutes: 30,
            requires_emergency_approval: false,
            compliance_tags: ['documentation', 'knowledge'],
            recommended_testing: 'Verify document is accessible to intended audience',
            recommended_rollback: 'Use version control, enable document history',
            display_order: 5
          }
        ]
      },
      {
        template_name: 'Retroactive Documentation',
        category: 'retroactive',
        description: 'Documenting work that was already completed before integration or formal process adoption',
        default_priority: 'low',
        default_risk_level: 'low',
        requires_approval: false,
        estimated_duration_minutes: 15,
        scenarios: [
          {
            scenario_name: 'Pre-Integration Work Documentation',
            scenario_description: 'Documenting work performed before CIPP/NinjaOne/platform integration was established',
            impact_level: 'low',
            typical_duration_minutes: 20,
            requires_emergency_approval: false,
            compliance_tags: ['documentation', 'historical'],
            recommended_testing: 'N/A - retroactive documentation',
            recommended_rollback: 'N/A - documentation only',
            display_order: 1
          },
          {
            scenario_name: 'Historical System Changes',
            scenario_description: 'Recording system changes made in the past that were not formally documented',
            impact_level: 'low',
            typical_duration_minutes: 25,
            requires_emergency_approval: false,
            compliance_tags: ['documentation', 'historical', 'compliance'],
            recommended_testing: 'N/A - retroactive documentation',
            recommended_rollback: 'N/A - documentation only',
            display_order: 2
          },
          {
            scenario_name: 'Legacy Configuration Documentation',
            scenario_description: 'Documenting existing configurations for systems that were already in place',
            impact_level: 'low',
            typical_duration_minutes: 30,
            requires_emergency_approval: false,
            compliance_tags: ['documentation', 'configuration', 'baseline'],
            recommended_testing: 'Verify documented configuration matches current state',
            recommended_rollback: 'N/A - documentation only',
            display_order: 3
          },
          {
            scenario_name: 'Migration Activity Logging',
            scenario_description: 'Retroactively documenting migration work (Office 365, server migrations, etc.)',
            impact_level: 'low',
            typical_duration_minutes: 40,
            requires_emergency_approval: false,
            compliance_tags: ['migration', 'documentation', 'project'],
            recommended_testing: 'N/A - retroactive documentation',
            recommended_rollback: 'N/A - documentation only',
            display_order: 4
          },
          {
            scenario_name: 'Inherited Environment Documentation',
            scenario_description: 'Documenting systems/configurations inherited from previous IT provider or in-house team',
            impact_level: 'low',
            typical_duration_minutes: 60,
            requires_emergency_approval: false,
            compliance_tags: ['documentation', 'discovery', 'baseline'],
            recommended_testing: 'Verify all discovered systems are accurately documented',
            recommended_rollback: 'N/A - documentation only',
            display_order: 5
          }
        ]
      }
    ];

    const createdTemplates = [];

    for (const templateWithScenarios of templates) {
      const { scenarios, ...template } = templateWithScenarios;

      // Insert template
      const { data: templateData, error: templateError } = await supabaseClient
        .from('change_request_templates')
        .insert({
          ...template,
          customer_id,
        })
        .select()
        .maybeSingle();
      
      if (!templateData) {
        console.error('Failed to create template:', template.template_name);
        continue;
      }

      if (templateError) {
        console.error('Error inserting template:', templateError);
        continue;
      }

      // Insert scenarios
      const scenariosWithTemplateId = scenarios.map(scenario => ({
        ...scenario,
        template_id: templateData.id
      }));

      const { error: scenariosError } = await supabaseClient
        .from('change_request_template_scenarios')
        .insert(scenariosWithTemplateId);

      if (scenariosError) {
        console.error('Error inserting scenarios:', scenariosError);
        continue;
      }

      createdTemplates.push({
        template: templateData,
        scenarios_count: scenarios.length
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdTemplates.length} templates with scenarios`,
        templates: createdTemplates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});