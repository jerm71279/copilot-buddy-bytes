import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, customerId } = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role for initial queries, then filter by RBAC
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authorization header to identify user
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userRoles: string[] = [];
    let isDevMode = Deno.env.get("ENVIRONMENT") === "development";

    if (authHeader) {
      // Verify user and get their roles
      const anonSupabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await anonSupabase.auth.getUser();
      
      if (user) {
        userId = user.id;
        
        // Get user's roles for RBAC filtering
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role_id, roles(name)")
          .eq("user_id", userId);
        
        if (roles) {
          userRoles = roles
            .map(r => (r as any).roles?.name)
            .filter(Boolean);
        }
      }
    }
    
    // In production, require authentication for search
    if (!isDevMode && !userId) {
      return new Response(JSON.stringify({ 
        results: [], 
        error: "Authentication required for search in production" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401
      });
    }

    // Helper to search JSONB fields for any mention
    const searchJsonb = (field: string, value: string) => 
      `${field}::text ilike '%${value}%'`;
    
    // Helper to search array fields
    const searchArray = (field: string, value: string) =>
      `EXISTS (SELECT 1 FROM unnest(${field}) AS elem WHERE elem::text ilike '%${value}%')`;

    // Search across ALL tables comprehensively - including metadata, relationships, and references
    const [
      workflows, 
      workflowTemplates,
      compliance, 
      complianceControls,
      complianceEvidence,
      cmdb, 
      knowledge, 
      changeRecords, 
      anomalies,
      auditLogs,
      users,
      applications,
      tenants,
      onboardings,
      complianceFrameworks,
      aiInteractions,
      projects,
      vendors,
      budgets,
      incidents,
      serviceRequests,
      leads,
      opportunities,
      quotes,
      purchaseOrders,
      invoices,
      expenses,
      employeeOnboardings,
      contracts,
      configItems,
      cippPolicies,
      products,
      customerAccounts,
      riskAssessments,
      remediationRules,
      slaManagement,
      departments,
      employees,
      timeTracking,
      leaveManagement,
      warehouse,
      inventory,
      networkDevices,
      mcpServers,
      promptTemplates,
      roles,
      assetFinancials,
      changeSchedules,
      workflowNodes,
      taskRepetition
    ] = await Promise.all([
      // Workflows - search name, description, AND execution logs (metadata)
      supabase.from("workflow_executions").select("*").or(`workflow_name.ilike.%${query}%,execution_logs.cs.${query}`).limit(5),
      supabase.from("workflow_templates").select("*").or(`workflow_name.ilike.%${query}%,description.ilike.%${query}%,workflow_config::text.ilike.%${query}%`).limit(5),
      // Compliance - search titles, descriptions, findings metadata, and tags
      supabase.from("compliance_audit_reports").select("*").or(`report_title.ilike.%${query}%,findings::text.ilike.%${query}%`).limit(5),
      supabase.from("compliance_controls").select("*").or(`control_name.ilike.%${query}%,description.ilike.%${query}%,control_id.ilike.%${query}%,implementation_notes::text.ilike.%${query}%`).limit(5),
      supabase.from("compliance_evidence").select("*").or(`title.ilike.%${query}%,description.ilike.%${query}%,file_name.ilike.%${query}%,compliance_tags::text.ilike.%${query}%`).limit(5),
      // CMDB - search name, description, attributes, and relationships
      supabase.from("cmdb_items").select("*").or(`name.ilike.%${query}%,description.ilike.%${query}%,attributes::text.ilike.%${query}%,item_type.ilike.%${query}%`).limit(5),
      // Knowledge - search title, content, tags, and author references
      supabase.from("knowledge_articles").select("*").or(`title.ilike.%${query}%,content.ilike.%${query}%,tags::text.ilike.%${query}%,category.ilike.%${query}%`).limit(5),
      // Change Requests - search all text fields, affected CIs, services, compliance tags, and audit trail
      supabase.from("change_requests").select("*").or(`title.ilike.%${query}%,description.ilike.%${query}%,change_number.ilike.%${query}%,justification.ilike.%${query}%,implementation_plan.ilike.%${query}%,rollback_plan.ilike.%${query}%,affected_ci_ids::text.ilike.%${query}%,affected_services::text.ilike.%${query}%,compliance_tags::text.ilike.%${query}%,audit_trail::text.ilike.%${query}%`).limit(5),
      // Anomalies - search description, system, type, raw data, and tags
      supabase.from("anomaly_detections").select("*").or(`description.ilike.%${query}%,system_name.ilike.%${query}%,anomaly_type.ilike.%${query}%,raw_data::text.ilike.%${query}%,compliance_tags::text.ilike.%${query}%`).limit(5),
      // Audit Logs - search system, action, details, and tags
      supabase.from("audit_logs").select("*").or(`system_name.ilike.%${query}%,action_type.ilike.%${query}%,action_details::text.ilike.%${query}%,compliance_tags::text.ilike.%${query}%`).limit(5),
      supabase.from("user_profiles").select("*").or(`full_name.ilike.%${query}%,department.ilike.%${query}%`).limit(5),
      supabase.from("applications").select("*").or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("cipp_tenants").select("*").or(`tenant_name.ilike.%${query}%,display_name.ilike.%${query}%`).limit(5),
      supabase.from("client_onboardings").select("*").or(`client_name.ilike.%${query}%,client_contact_name.ilike.%${query}%`).limit(5),
      supabase.from("compliance_frameworks").select("*").or(`framework_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      // AI Interactions - search queries, responses, knowledge sources, and metadata
      supabase.from("ai_interactions").select("*").or(`user_query.ilike.%${query}%,ai_response.ilike.%${query}%,knowledge_sources::text.ilike.%${query}%,compliance_tags::text.ilike.%${query}%,metadata::text.ilike.%${query}%`).limit(5),
      // Projects - search name, description, number, metadata, and team members
      supabase.from("projects").select("*").or(`project_name.ilike.%${query}%,description.ilike.%${query}%,project_number.ilike.%${query}%,metadata::text.ilike.%${query}%,objectives.ilike.%${query}%`).limit(5),
      supabase.from("vendors").select("*").or(`vendor_name.ilike.%${query}%,vendor_code.ilike.%${query}%`).limit(5),
      supabase.from("budgets").select("*").or(`budget_name.ilike.%${query}%,department.ilike.%${query}%`).limit(5),
      // Incidents - search title, number, description, resolution notes, and affected systems
      supabase.from("incidents").select("*").or(`title.ilike.%${query}%,incident_number.ilike.%${query}%,description.ilike.%${query}%,resolution_notes.ilike.%${query}%,root_cause.ilike.%${query}%,affected_systems::text.ilike.%${query}%`).limit(5),
      supabase.from("service_requests").select("*").or(`title.ilike.%${query}%,request_number.ilike.%${query}%`).limit(5),
      supabase.from("leads").select("*").or(`lead_name.ilike.%${query}%,company_name.ilike.%${query}%,lead_number.ilike.%${query}%`).limit(5),
      supabase.from("sales_opportunities").select("*").or(`opportunity_name.ilike.%${query}%,opportunity_number.ilike.%${query}%`).limit(5),
      supabase.from("sales_quotes").select("*").or(`quote_number.ilike.%${query}%,client_name.ilike.%${query}%`).limit(5),
      supabase.from("purchase_orders").select("*").or(`po_number.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("invoices").select("*").or(`invoice_number.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("expenses").select("*").or(`expense_number.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("employee_onboardings").select("*").or(`employee_name.ilike.%${query}%,employee_number.ilike.%${query}%`).limit(5),
      // Contracts - search number, title, terms, and parties involved
      supabase.from("vendor_contracts").select("*").or(`contract_number.ilike.%${query}%,contract_title.ilike.%${query}%,contract_terms.ilike.%${query}%,payment_terms.ilike.%${query}%`).limit(5),
      // Configuration Items - search name, tags, serial, attributes, hostname, OS, and all metadata
      supabase.from("configuration_items").select("*").or(`ci_name.ilike.%${query}%,description.ilike.%${query}%,asset_tag.ilike.%${query}%,serial_number.ilike.%${query}%,attributes::text.ilike.%${query}%,hostname.ilike.%${query}%,operating_system.ilike.%${query}%,manufacturer.ilike.%${query}%,model.ilike.%${query}%,location.ilike.%${query}%,department.ilike.%${query}%,compliance_tags::text.ilike.%${query}%,notes.ilike.%${query}%`).limit(5),
      // CIPP Policies - search name, type, configuration, and tags
      supabase.from("cipp_policies").select("*").or(`policy_name.ilike.%${query}%,policy_type.ilike.%${query}%,policy_id.ilike.%${query}%,configuration::text.ilike.%${query}%,compliance_tags::text.ilike.%${query}%`).limit(5),
      supabase.from("products").select("*").or(`product_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("customer_accounts").select("*").or(`account_name.ilike.%${query}%,account_number.ilike.%${query}%`).limit(5),
      supabase.from("risk_assessments").select("*").or(`risk_id.ilike.%${query}%,risk_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("remediation_rules").select("*").or(`rule_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("sla_management").select("*").or(`sla_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("department_management").select("*").or(`department_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("employee_directory").select("*").or(`employee_name.ilike.%${query}%,employee_number.ilike.%${query}%,email.ilike.%${query}%`).limit(5),
      supabase.from("time_tracking").select("*").or(`task_description.ilike.%${query}%,project_name.ilike.%${query}%`).limit(5),
      supabase.from("leave_requests").select("*").or(`leave_type.ilike.%${query}%,reason.ilike.%${query}%`).limit(5),
      supabase.from("warehouse_locations").select("*").or(`location_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("inventory_items").select("*").or(`item_name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("network_devices").select("*").or(`device_name.ilike.%${query}%,ip_address.ilike.%${query}%,hostname.ilike.%${query}%`).limit(5),
      supabase.from("mcp_server_config").select("*").or(`server_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("prompt_templates").select("*").or(`template_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("roles").select("*").or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("asset_financials").select("*").or(`depreciation_method.ilike.%${query}%`).limit(5),
      supabase.from("change_schedules").select("*").or(`blackout_reason.ilike.%${query}%`).limit(5),
      supabase.from("workflow_nodes").select("*").or(`node_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      // Task Repetition - search patterns, suggestions, and detection data
      supabase.from("task_repetition_analysis").select("*").or(`task_pattern.ilike.%${query}%,suggested_automation.ilike.%${query}%,workflow_suggestion::text.ilike.%${query}%`).limit(5),
      
      // CI Relationships - search for items connected to the query
      supabase.from("ci_relationships").select("*, source:source_ci_id(ci_name), target:target_ci_id(ci_name)").or(`description.ilike.%${query}%`).limit(5),
      
      // CI Audit Log - search for change history mentions
      supabase.from("ci_audit_log").select("*").or(`field_name.ilike.%${query}%,old_value::text.ilike.%${query}%,new_value::text.ilike.%${query}%,change_reason.ilike.%${query}%`).limit(5),
      
      // Workflow Execution Steps - search step details
      supabase.from("workflow_execution_steps").select("*").or(`step_name.ilike.%${query}%,step_output::text.ilike.%${query}%,error_message.ilike.%${query}%`).limit(5),
      
      // MCP Execution Logs - search MCP server operations
      supabase.from("mcp_execution_logs").select("*").or(`operation_type.ilike.%${query}%,request_data::text.ilike.%${query}%,response_data::text.ilike.%${query}%,error_message.ilike.%${query}%`).limit(5),
    ]);

    // Use AI to rank and contextualize results
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // Static pages that can be searched
    const staticPages = [];
    if (query.toLowerCase().includes('test') || query.toLowerCase().includes('dashboard')) {
      staticPages.push({ type: "page", data: { name: "Test Dashboard" }, title: "Comprehensive Test Dashboard", url: "/testing-dashboard" });
    }
    if (query.toLowerCase().includes('analytics')) {
      staticPages.push({ type: "page", data: { name: "Analytics" }, title: "Analytics Portal", url: "/analytics" });
    }
    if (query.toLowerCase().includes('executive')) {
      staticPages.push({ type: "page", data: { name: "Executive" }, title: "Executive Dashboard", url: "/executive" });
    }
    if (query.toLowerCase().includes('insight')) {
      staticPages.push({ type: "page", data: { name: "Insights" }, title: "Department Insights", url: "/department-insights" });
      staticPages.push({ type: "page", data: { name: "Global Insights" }, title: "Global Insights", url: "/global-insights" });
    }
    if (query.toLowerCase().includes('feedback')) {
      staticPages.push({ type: "page", data: { name: "Feedback" }, title: "Department Feedback", url: "/department-feedback" });
    }

    // Helper function to check if user has permission for a resource
    const hasPermission = (resourceType: string, resourceName: string): boolean => {
      // In dev mode, allow all
      if (isDevMode) return true;
      
      // Admins and Super Admins can see everything
      if (userRoles.includes("Super Admin") || userRoles.includes("Admin")) {
        return true;
      }
      
      // Check specific permissions based on resource type
      const permissionMap: Record<string, string[]> = {
        "workflow": ["Operations", "IT", "Admin"],
        "compliance": ["Compliance", "Security", "Admin"],
        "cmdb": ["IT", "Operations", "Admin"],
        "change": ["IT", "Operations", "Admin"],
        "incident": ["IT", "Security", "Operations", "Admin"],
        "risk": ["Security", "Compliance", "Admin"],
        "vendor": ["Finance", "Admin"],
        "budget": ["Finance", "Admin"],
        "project": ["Operations", "Admin"],
        "employee": ["HR", "Admin"],
        "contract": ["Finance", "Legal", "Admin"],
        "sla": ["Operations", "IT", "Admin"],
        // Default: any authenticated user can see these
        "knowledge": ["User"],
        "application": ["User"],
        "page": ["User"],
      };
      
      const allowedRoles = permissionMap[resourceType] || ["Admin"];
      return allowedRoles.some(role => userRoles.includes(role)) || allowedRoles.includes("User");
    };

    const allResults = [
      ...(workflows.data || []).map(w => ({ type: "workflow", data: w, title: w.workflow_name, url: `/workflow-execution/${w.id}` })),
      ...(workflowTemplates.data || []).map(wt => ({ type: "workflow-template", data: wt, title: wt.workflow_name, url: `/workflow-orchestration` })),
      ...(compliance.data || []).map(c => ({ type: "compliance", data: c, title: c.report_title, url: `/compliance/reports/${c.id}` })),
      ...(complianceControls.data || []).map(cc => ({ type: "compliance-control", data: cc, title: cc.control_name, url: `/compliance/frameworks/${cc.framework_id}/controls/${cc.id}` })),
      ...(complianceEvidence.data || []).map(ce => ({ type: "evidence", data: ce, title: ce.title, url: `/compliance/evidence-upload` })),
      ...(cmdb.data || []).map(i => ({ type: "cmdb", data: i, title: i.name, url: `/cmdb/items/${i.id}` })),
      ...(knowledge.data || []).map(k => ({ type: "knowledge", data: k, title: k.title, url: `/knowledge/${k.id}` })),
      ...(changeRecords.data || []).map(cr => ({ type: "change", data: cr, title: `${cr.change_number}: ${cr.title}`, url: `/change-management/${cr.id}` })),
      ...(anomalies.data || []).map(a => ({ type: "anomaly", data: a, title: `${a.anomaly_type} - ${a.system_name}`, url: `/dashboard/soc` })),
      ...(auditLogs.data || []).map(al => ({ type: "audit", data: al, title: `${al.action_type} - ${al.system_name}`, url: `/compliance/audit-reports` })),
      ...(users.data || []).map(u => ({ type: "user", data: u, title: u.full_name || "User", url: `/employee-directory` })),
      ...(applications.data || []).map(app => ({ type: "application", data: app, title: app.name, url: `/admin/applications` })),
      ...(tenants.data || []).map(t => ({ type: "tenant", data: t, title: t.tenant_name, url: `/cipp` })),
      ...(onboardings.data || []).map(o => ({ type: "onboarding", data: o, title: `${o.client_name} Onboarding`, url: `/onboarding` })),
      ...(complianceFrameworks.data || []).map(cf => ({ type: "framework", data: cf, title: cf.framework_name, url: `/compliance/frameworks/${cf.id}` })),
      ...(aiInteractions.data || []).map(ai => ({ type: "ai-chat", data: ai, title: ai.user_query.substring(0, 50) + "...", url: `/intelligent-assistant` })),
      ...(projects.data || []).map(p => ({ type: "project", data: p, title: `${p.project_number}: ${p.project_name}`, url: `/project-management` })),
      ...(vendors.data || []).map(v => ({ type: "vendor", data: v, title: `${v.vendor_code}: ${v.vendor_name}`, url: `/vendor-management/${v.id}` })),
      ...(budgets.data || []).map(b => ({ type: "budget", data: b, title: b.budget_name, url: `/budget-tracking` })),
      ...(incidents.data || []).map(i => ({ type: "incident", data: i, title: `${i.incident_number}: ${i.title}`, url: `/incidents/${i.id}` })),
      ...(serviceRequests.data || []).map(sr => ({ type: "service-request", data: sr, title: `${sr.request_number}: ${sr.title}`, url: `/service-requests` })),
      ...(leads.data || []).map(l => ({ type: "lead", data: l, title: `${l.lead_number}: ${l.lead_name}`, url: `/sales/leads` })),
      ...(opportunities.data || []).map(o => ({ type: "opportunity", data: o, title: `${o.opportunity_number}: ${o.opportunity_name}`, url: `/sales/opportunities` })),
      ...(quotes.data || []).map(q => ({ type: "quote", data: q, title: `Quote ${q.quote_number}`, url: `/sales/quotes` })),
      ...(purchaseOrders.data || []).map(po => ({ type: "purchase-order", data: po, title: `PO ${po.po_number}`, url: `/purchase-orders` })),
      ...(invoices.data || []).map(inv => ({ type: "invoice", data: inv, title: `Invoice ${inv.invoice_number}`, url: `/invoice-management` })),
      ...(expenses.data || []).map(exp => ({ type: "expense", data: exp, title: `Expense ${exp.expense_number}`, url: `/expense-management` })),
      ...(employeeOnboardings.data || []).map(eo => ({ type: "employee-onboarding", data: eo, title: `${eo.employee_name} Onboarding`, url: `/hr/employee-onboarding/${eo.id}` })),
      ...(contracts.data || []).map(c => ({ type: "contract", data: c, title: `${c.contract_number}: ${c.contract_title}`, url: `/contract-management` })),
      ...(configItems.data || []).map(ci => ({ type: "config-item", data: ci, title: ci.ci_name, url: `/cmdb/items/${ci.id}` })),
      ...(cippPolicies.data || []).map(cp => ({ type: "cipp-policy", data: cp, title: cp.policy_name, url: `/cipp` })),
      ...(products.data || []).map(p => ({ type: "product", data: p, title: p.product_name, url: `/admin/products` })),
      ...(customerAccounts.data || []).map(ca => ({ type: "customer-account", data: ca, title: `${ca.account_number}: ${ca.account_name}`, url: `/customer-accounts/${ca.id}` })),
      ...(riskAssessments.data || []).map(ra => ({ type: "risk", data: ra, title: `${ra.risk_id}: ${ra.risk_name}`, url: `/risk-assessment` })),
      ...(remediationRules.data || []).map(rr => ({ type: "remediation", data: rr, title: rr.rule_name, url: `/remediation-rules` })),
      ...(slaManagement.data || []).map(sla => ({ type: "sla", data: sla, title: sla.sla_name, url: `/sla-management` })),
      ...(departments.data || []).map(d => ({ type: "department", data: d, title: d.department_name, url: `/department-management` })),
      ...(employees.data || []).map(e => ({ type: "employee", data: e, title: `${e.employee_number}: ${e.employee_name}`, url: `/employee-directory` })),
      ...(timeTracking.data || []).map(tt => ({ type: "time-entry", data: tt, title: tt.task_description || "Time Entry", url: `/time-tracking` })),
      ...(leaveManagement.data || []).map(lr => ({ type: "leave-request", data: lr, title: `${lr.leave_type} Request`, url: `/leave-management` })),
      ...(warehouse.data || []).map(wh => ({ type: "warehouse", data: wh, title: wh.location_name, url: `/warehouse-management` })),
      ...(inventory.data || []).map(inv => ({ type: "inventory", data: inv, title: `${inv.sku}: ${inv.item_name}`, url: `/inventory-management` })),
      ...(networkDevices.data || []).map(nd => ({ type: "network-device", data: nd, title: nd.device_name, url: `/network-monitoring` })),
      ...(mcpServers.data || []).map(mcp => ({ type: "mcp-server", data: mcp, title: mcp.server_name, url: `/mcp-server-dashboard` })),
      ...(promptTemplates.data || []).map(pt => ({ type: "prompt-template", data: pt, title: pt.template_name, url: `/prompt-library` })),
      ...(roles.data || []).map(r => ({ type: "role", data: r, title: r.name, url: `/rbac` })),
      ...(assetFinancials.data || []).map(af => ({ type: "asset-financial", data: af, title: "Asset Financial Record", url: `/asset-financials` })),
      ...(changeSchedules.data || []).map(cs => ({ type: "change-schedule", data: cs, title: `Maintenance Schedule`, url: `/change-management` })),
      ...(workflowNodes.data || []).map(wn => ({ type: "workflow-node", data: wn, title: wn.node_name, url: `/workflow-builder` })),
      ...(taskRepetition.data || []).map(tr => ({ type: "automation-suggestion", data: tr, title: `Automation: ${tr.task_pattern}`, url: `/portal` })),
      
      // Add CI relationships as searchable items
      ...((await supabase.from("ci_relationships").select("*, source:source_ci_id(ci_name), target:target_ci_id(ci_name)").or(`description.ilike.%${query}%`).limit(5)).data || []).map((rel: any) => ({
        type: "ci-relationship",
        data: rel,
        title: `${rel.source?.ci_name || 'Unknown'} → ${rel.target?.ci_name || 'Unknown'}`,
        url: `/cmdb`,
        description: rel.relationship_type
      })),
      
      // Add audit log entries
      ...((await supabase.from("ci_audit_log").select("*").or(`field_name.ilike.%${query}%,old_value::text.ilike.%${query}%,new_value::text.ilike.%${query}%`).limit(5)).data || []).map((log: any) => ({
        type: "audit-entry",
        data: log,
        title: `${log.change_type} - ${log.field_name || 'Multiple fields'}`,
        url: `/cmdb`,
        description: log.change_reason
      })),
      
      // Add workflow execution steps
      ...((await supabase.from("workflow_execution_steps").select("*").or(`step_name.ilike.%${query}%,error_message.ilike.%${query}%`).limit(5)).data || []).map((step: any) => ({
        type: "workflow-step",
        data: step,
        title: `Step: ${step.step_name}`,
        url: `/workflow-orchestration`,
        description: step.status
      })),
      
      // Add MCP execution logs
      ...((await supabase.from("mcp_execution_logs").select("*").or(`operation_type.ilike.%${query}%,error_message.ilike.%${query}%`).limit(5)).data || []).map((log: any) => ({
        type: "mcp-log",
        data: log,
        title: `MCP: ${log.operation_type}`,
        url: `/mcp-server-dashboard`,
        description: log.status
      })),
      ...staticPages,
    ].filter(result => {
      // Apply RBAC filtering
      return hasPermission(result.type, result.type);
    });

    if (LOVABLE_API_KEY && allResults.length > 0) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You analyze search results and provide a brief relevance summary. Return only JSON with 'summary' and 'topMatch' fields."
              },
              {
                role: "user",
                content: `Query: "${query}"\nResults: ${JSON.stringify(allResults.slice(0, 10).map(r => ({ type: r.type, title: r.title })))}\n\nProvide a one-sentence summary and indicate the most relevant result type.`
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "analyze_search",
                description: "Analyze search results",
                parameters: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    topMatch: { type: "string" }
                  },
                  required: ["summary", "topMatch"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "analyze_search" } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const analysis = JSON.parse(toolCall.function.arguments);
            return new Response(JSON.stringify({ results: allResults, aiSummary: analysis.summary, topMatch: analysis.topMatch }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
      }
    }

    return new Response(JSON.stringify({ 
      results: allResults,
      devMode: isDevMode,
      userRoles: isDevMode ? userRoles : undefined // Only expose in dev mode
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
