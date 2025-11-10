/**
 * Pre-built Workflow Templates for OberaConnect
 *
 * These templates provide common automation workflows for MSP operations:
 * 1. Client Onboarding Automation
 * 2. Weekly Compliance Evidence Collection
 * 3. Monthly Client Reporting
 * 4. Device Patching Alerts
 */

export interface WorkflowTemplate {
  workflow_name: string;
  description: string;
  workflow_type: string;
  is_active: boolean;
  steps: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
    sequence: number;
  }>;
  systems_involved?: string[];
  tags?: string[];
  compliance_tags?: string[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Template 1: Client Onboarding Automation
  {
    workflow_name: "Client Onboarding Automation",
    description: "Automates the complete client onboarding process across multiple systems (CIPP, NinjaOne, compliance frameworks). Reduces 6+ hours of manual work to 30 minutes.",
    workflow_type: "onboarding",
    is_active: false, // Inactive by default - user must activate
    systems_involved: ["cipp", "ninjaone", "email", "compliance"],
    tags: ["automation", "onboarding", "high-roi"],
    compliance_tags: ["setup", "documentation"],
    steps: [
      {
        id: "step-1",
        type: "trigger",
        sequence: 0,
        config: {
          trigger_type: "manual",
          name: "New Customer Created",
          description: "Triggered when a new customer record is created in OberaConnect"
        }
      },
      {
        id: "step-2",
        type: "api_call",
        sequence: 1,
        config: {
          system: "cipp",
          endpoint: "create_tenant",
          method: "POST",
          description: "Create M365 tenant in CIPP",
          payload: {
            customer_name: "{{customer.name}}",
            customer_id: "{{customer.id}}"
          }
        }
      },
      {
        id: "step-3",
        type: "api_call",
        sequence: 2,
        config: {
          system: "ninjaone",
          endpoint: "create_organization",
          method: "POST",
          description: "Create organization in NinjaOne RMM",
          payload: {
            organization_name: "{{customer.name}}",
            contact_email: "{{customer.contact_email}}"
          }
        }
      },
      {
        id: "step-4",
        type: "database_operation",
        sequence: 3,
        config: {
          operation: "insert",
          table: "compliance_frameworks",
          description: "Initialize compliance framework based on customer industry",
          data: {
            customer_id: "{{customer.id}}",
            framework_type: "{{customer.compliance_framework}}", // HIPAA, SOC2, ISO
            status: "active"
          }
        }
      },
      {
        id: "step-5",
        type: "notification",
        sequence: 4,
        config: {
          channel: "email",
          recipient: "{{customer.contact_email}}",
          subject: "Welcome to OberaConnect",
          template: "customer_welcome",
          description: "Send welcome email to customer with portal access instructions"
        }
      },
      {
        id: "step-6",
        type: "notification",
        sequence: 5,
        config: {
          channel: "slack",
          recipient: "#customer-success",
          message: "New customer onboarded: {{customer.name}}",
          description: "Notify Obera team in Slack"
        }
      }
    ]
  },

  // Template 2: Weekly Compliance Evidence Collection
  {
    workflow_name: "Weekly Compliance Evidence Collection",
    description: "Automatically collects compliance evidence from NinjaOne, CIPP, and network devices weekly. Maps evidence to HIPAA/SOC 2 controls. Saves 10-12 hours per quarterly audit.",
    workflow_type: "compliance",
    is_active: false,
    systems_involved: ["ninjaone", "cipp", "network_devices", "compliance"],
    tags: ["automation", "compliance", "evidence", "scheduled"],
    compliance_tags: ["hipaa", "soc2", "iso27001", "evidence_collection"],
    steps: [
      {
        id: "step-1",
        type: "trigger",
        sequence: 0,
        config: {
          trigger_type: "scheduled",
          schedule: "0 8 * * 1", // Every Monday at 8 AM (cron format)
          name: "Weekly Evidence Collection",
          description: "Runs every Monday morning"
        }
      },
      {
        id: "step-2",
        type: "api_call",
        sequence: 1,
        config: {
          system: "ninjaone",
          endpoint: "get_patch_status",
          method: "GET",
          description: "Fetch patch compliance status for all customer devices",
          params: {
            customer_id: "{{customer.id}}",
            date_range: "last_7_days"
          }
        }
      },
      {
        id: "step-3",
        type: "api_call",
        sequence: 2,
        config: {
          system: "ninjaone",
          endpoint: "get_antivirus_status",
          method: "GET",
          description: "Fetch antivirus status and failed login attempts",
          params: {
            customer_id: "{{customer.id}}",
            date_range: "last_7_days"
          }
        }
      },
      {
        id: "step-4",
        type: "api_call",
        sequence: 3,
        config: {
          system: "cipp",
          endpoint: "get_security_score",
          method: "GET",
          description: "Fetch M365 security score and changes",
          params: {
            tenant_id: "{{customer.tenant_id}}"
          }
        }
      },
      {
        id: "step-5",
        type: "api_call",
        sequence: 4,
        config: {
          system: "cipp",
          endpoint: "get_conditional_access",
          method: "GET",
          description: "Fetch conditional access policies and MFA enforcement status",
          params: {
            tenant_id: "{{customer.tenant_id}}"
          }
        }
      },
      {
        id: "step-6",
        type: "api_call",
        sequence: 5,
        config: {
          system: "network_devices",
          endpoint: "get_firewall_changes",
          method: "GET",
          description: "Fetch firewall rule changes and VPN access logs",
          params: {
            customer_id: "{{customer.id}}",
            date_range: "last_7_days"
          }
        }
      },
      {
        id: "step-7",
        type: "data_transform",
        sequence: 6,
        config: {
          operation: "map_to_controls",
          description: "Map collected evidence to compliance framework controls",
          mappings: {
            "HIPAA_164_308_a_5_ii_B": "MFA enforcement logs",
            "HIPAA_164_312_b": "Audit logs from all systems",
            "SOC2_CC6_1": "Access control policies",
            "SOC2_CC7_2": "Security monitoring logs"
          }
        }
      },
      {
        id: "step-8",
        type: "database_operation",
        sequence: 7,
        config: {
          operation: "insert",
          table: "compliance_evidence",
          description: "Store evidence records linked to controls",
          data: {
            customer_id: "{{customer.id}}",
            control_id: "{{mapped_control_id}}",
            evidence_type: "automated_collection",
            evidence_data: "{{collected_data}}",
            collection_date: "{{current_date}}"
          }
        }
      },
      {
        id: "step-9",
        type: "database_operation",
        sequence: 8,
        config: {
          operation: "insert",
          table: "evidence_files",
          description: "Store evidence files for auditor access",
          data: {
            customer_id: "{{customer.id}}",
            file_type: "json",
            file_content: "{{collected_data}}",
            control_reference: "{{control_id}}"
          }
        }
      },
      {
        id: "step-10",
        type: "condition",
        sequence: 9,
        config: {
          condition_type: "check_gaps",
          description: "Check if any controls are missing evidence",
          condition: "{{missing_evidence_count}} > 0"
        }
      },
      {
        id: "step-11",
        type: "notification",
        sequence: 10,
        config: {
          channel: "email",
          recipient: "compliance@obera.com",
          subject: "Compliance Evidence Gaps Detected - {{customer.name}}",
          template: "compliance_gaps_alert",
          description: "Alert compliance team if gaps found",
          conditional: "{{step-10.result}} === true"
        }
      }
    ]
  },

  // Template 3: Monthly Client Reporting
  {
    workflow_name: "Monthly Client Reporting",
    description: "Generates and sends automated monthly reports to clients with ticket stats, device health, security score, and compliance status. Saves 2 hours per client per month.",
    workflow_type: "reporting",
    is_active: false,
    systems_involved: ["ninjaone", "cipp", "client_portal", "email"],
    tags: ["automation", "reporting", "scheduled", "client-facing"],
    compliance_tags: ["reporting", "transparency"],
    steps: [
      {
        id: "step-1",
        type: "trigger",
        sequence: 0,
        config: {
          trigger_type: "scheduled",
          schedule: "0 17 1 * *", // 1st of every month at 5 PM (cron format)
          name: "Monthly Client Report",
          description: "Generate and send monthly reports on the 1st of each month"
        }
      },
      {
        id: "step-2",
        type: "database_operation",
        sequence: 1,
        config: {
          operation: "select",
          table: "client_tickets",
          description: "Fetch ticket statistics for the past month",
          query: {
            customer_id: "{{customer.id}}",
            created_at_gte: "{{first_day_last_month}}",
            created_at_lt: "{{first_day_this_month}}"
          },
          aggregations: {
            total_tickets: "count(*)",
            resolved_tickets: "count(status = 'resolved')",
            avg_resolution_time: "avg(resolution_time_hours)"
          }
        }
      },
      {
        id: "step-3",
        type: "api_call",
        sequence: 2,
        config: {
          system: "ninjaone",
          endpoint: "get_device_health",
          method: "GET",
          description: "Fetch device patch compliance and health status",
          params: {
            customer_id: "{{customer.id}}"
          }
        }
      },
      {
        id: "step-4",
        type: "api_call",
        sequence: 3,
        config: {
          system: "cipp",
          endpoint: "get_security_score",
          method: "GET",
          description: "Fetch M365 security score and month-over-month change",
          params: {
            tenant_id: "{{customer.tenant_id}}"
          }
        }
      },
      {
        id: "step-5",
        type: "database_operation",
        sequence: 4,
        config: {
          operation: "select",
          table: "compliance_frameworks",
          description: "Fetch compliance status and percentage complete",
          query: {
            customer_id: "{{customer.id}}",
            status: "active"
          }
        }
      },
      {
        id: "step-6",
        type: "database_operation",
        sequence: 5,
        config: {
          operation: "select",
          table: "anomaly_detections",
          description: "Fetch security incidents from the past month",
          query: {
            customer_id: "{{customer.id}}",
            detected_at_gte: "{{first_day_last_month}}",
            detected_at_lt: "{{first_day_this_month}}"
          }
        }
      },
      {
        id: "step-7",
        type: "data_transform",
        sequence: 6,
        config: {
          operation: "generate_report",
          description: "Compile all data into report structure",
          format: "pdf",
          template: "monthly_executive_report",
          sections: [
            "executive_summary",
            "ticket_statistics",
            "device_health",
            "security_posture",
            "compliance_status",
            "incidents_summary"
          ]
        }
      },
      {
        id: "step-8",
        type: "database_operation",
        sequence: 7,
        config: {
          operation: "insert",
          table: "workflow_executions",
          description: "Store generated report in database",
          data: {
            workflow_id: "{{workflow.id}}",
            customer_id: "{{customer.id}}",
            execution_type: "monthly_report",
            report_data: "{{generated_report}}",
            report_period: "{{last_month}}"
          }
        }
      },
      {
        id: "step-9",
        type: "notification",
        sequence: 8,
        config: {
          channel: "email",
          recipient: "{{customer.contact_email}}",
          subject: "Your Monthly IT & Security Report - {{month_name}} {{year}}",
          template: "monthly_report_email",
          attachments: ["{{generated_report.pdf}}"],
          description: "Send report to customer contacts"
        }
      },
      {
        id: "step-10",
        type: "notification",
        sequence: 9,
        config: {
          channel: "slack",
          recipient: "#customer-success",
          message: "Monthly report sent to {{customer.name}}",
          description: "Notify Obera team that report was delivered"
        }
      }
    ]
  },

  // Template 4: Device Patching Alerts
  {
    workflow_name: "Critical Device Patching Alerts",
    description: "Monitors device patch status in NinjaOne and automatically creates tickets for critical missing patches. Runs daily to ensure security compliance.",
    workflow_type: "monitoring",
    is_active: false,
    systems_involved: ["ninjaone", "client_portal", "email"],
    tags: ["automation", "monitoring", "security", "patching"],
    compliance_tags: ["patch_management", "vulnerability_management"],
    steps: [
      {
        id: "step-1",
        type: "trigger",
        sequence: 0,
        config: {
          trigger_type: "scheduled",
          schedule: "0 9 * * *", // Every day at 9 AM (cron format)
          name: "Daily Patch Status Check",
          description: "Check patch compliance daily"
        }
      },
      {
        id: "step-2",
        type: "api_call",
        sequence: 1,
        config: {
          system: "ninjaone",
          endpoint: "get_missing_patches",
          method: "GET",
          description: "Fetch devices with critical missing patches",
          params: {
            customer_id: "{{customer.id}}",
            severity: "critical",
            age_days_gt: 7 // Patches missing for more than 7 days
          }
        }
      },
      {
        id: "step-3",
        type: "condition",
        sequence: 2,
        config: {
          condition_type: "check_count",
          description: "Check if any critical patches are missing",
          condition: "{{missing_patches.length}} > 0"
        }
      },
      {
        id: "step-4",
        type: "loop",
        sequence: 3,
        config: {
          loop_type: "foreach",
          iterator: "{{missing_patches}}",
          description: "Create ticket for each device with missing patches",
          conditional: "{{step-3.result}} === true"
        }
      },
      {
        id: "step-5",
        type: "api_call",
        sequence: 4,
        config: {
          system: "client_portal",
          endpoint: "create_ticket",
          method: "POST",
          description: "Create high-priority ticket for missing patch",
          payload: {
            customer_id: "{{customer.id}}",
            subject: "Critical Patch Missing: {{device.name}}",
            description: "Device {{device.name}} is missing critical security patch: {{patch.name}}. This patch has been available for {{patch.age_days}} days and should be applied immediately.",
            category: "technical",
            priority: "high",
            assigned_to: "it_team"
          },
          parent_step: "step-4" // Executed within loop
        }
      },
      {
        id: "step-6",
        type: "notification",
        sequence: 5,
        config: {
          channel: "email",
          recipient: "it@obera.com",
          subject: "Critical Patch Alert: {{customer.name}} - {{missing_patches.length}} devices",
          template: "critical_patch_alert",
          description: "Alert Obera IT team about critical patches",
          conditional: "{{step-3.result}} === true"
        }
      },
      {
        id: "step-7",
        type: "database_operation",
        sequence: 6,
        config: {
          operation: "insert",
          table: "audit_logs",
          description: "Log patch alert for compliance audit trail",
          data: {
            customer_id: "{{customer.id}}",
            action_type: "patch_alert",
            action_description: "Critical patch alert triggered for {{missing_patches.length}} devices",
            affected_systems: "ninjaone",
            severity: "high"
          }
        }
      }
    ]
  }
];

/**
 * Load workflow templates into the database for a specific customer
 * @param customerId - The customer ID to associate templates with
 * @returns Array of created workflow IDs
 */
export async function loadWorkflowTemplates(customerId: string): Promise<string[]> {
  const { supabase } = await import('@/integrations/supabase/client');

  const createdIds: string[] = [];

  for (const template of WORKFLOW_TEMPLATES) {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          customer_id: customerId,
          workflow_name: template.workflow_name,
          description: template.description,
          workflow_type: template.workflow_type,
          is_active: template.is_active,
          steps: template.steps as any,
          systems_involved: template.systems_involved,
          tags: template.tags,
          compliance_tags: template.compliance_tags
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Failed to load template: ${template.workflow_name}`, error);
        continue;
      }

      if (data) {
        createdIds.push(data.id);
      }
    } catch (err) {
      console.error(`Error loading template: ${template.workflow_name}`, err);
    }
  }

  return createdIds;
}
