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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search across multiple tables
    const [
      workflows, 
      compliance, 
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
      customerAccounts
    ] = await Promise.all([
      supabase.from("workflow_executions").select("*").ilike("workflow_name", `%${query}%`).limit(5),
      supabase.from("compliance_audit_reports").select("*").ilike("report_title", `%${query}%`).limit(5),
      supabase.from("cmdb_items").select("*").or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("knowledge_articles").select("*").or(`title.ilike.%${query}%,content.ilike.%${query}%`).limit(5),
      supabase.from("change_requests").select("*").or(`title.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("anomaly_detections").select("*").or(`description.ilike.%${query}%,system_name.ilike.%${query}%,anomaly_type.ilike.%${query}%`).limit(5),
      supabase.from("audit_logs").select("*").or(`system_name.ilike.%${query}%,action_type.ilike.%${query}%`).limit(5),
      supabase.from("user_profiles").select("*").or(`full_name.ilike.%${query}%,department.ilike.%${query}%`).limit(5),
      supabase.from("applications").select("*").or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("cipp_tenants").select("*").or(`tenant_name.ilike.%${query}%,display_name.ilike.%${query}%`).limit(5),
      supabase.from("client_onboardings").select("*").or(`client_name.ilike.%${query}%,client_contact_name.ilike.%${query}%`).limit(5),
      supabase.from("compliance_frameworks").select("*").or(`framework_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("ai_interactions").select("*").or(`user_query.ilike.%${query}%,ai_response.ilike.%${query}%`).limit(5),
      supabase.from("projects").select("*").or(`project_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("vendors").select("*").or(`vendor_name.ilike.%${query}%,vendor_code.ilike.%${query}%`).limit(5),
      supabase.from("budgets").select("*").or(`budget_name.ilike.%${query}%,department.ilike.%${query}%`).limit(5),
      supabase.from("incidents").select("*").or(`title.ilike.%${query}%,incident_number.ilike.%${query}%`).limit(5),
      supabase.from("service_requests").select("*").or(`title.ilike.%${query}%,request_number.ilike.%${query}%`).limit(5),
      supabase.from("leads").select("*").or(`lead_name.ilike.%${query}%,company_name.ilike.%${query}%`).limit(5),
      supabase.from("sales_opportunities").select("*").or(`opportunity_name.ilike.%${query}%,opportunity_number.ilike.%${query}%`).limit(5),
      supabase.from("sales_quotes").select("*").or(`quote_number.ilike.%${query}%,client_name.ilike.%${query}%`).limit(5),
      supabase.from("purchase_orders").select("*").or(`po_number.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("invoices").select("*").or(`invoice_number.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("expenses").select("*").or(`expense_number.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("employee_onboardings").select("*").or(`employee_name.ilike.%${query}%,employee_number.ilike.%${query}%`).limit(5),
      supabase.from("vendor_contracts").select("*").or(`contract_number.ilike.%${query}%,contract_title.ilike.%${query}%`).limit(5),
      supabase.from("configuration_items").select("*").or(`ci_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("cipp_policies").select("*").or(`policy_name.ilike.%${query}%,policy_type.ilike.%${query}%`).limit(5),
      supabase.from("products").select("*").or(`product_name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
      supabase.from("customer_accounts").select("*").or(`account_name.ilike.%${query}%,account_number.ilike.%${query}%`).limit(5),
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

    const allResults = [
      ...(workflows.data || []).map(w => ({ type: "workflow", data: w, title: w.workflow_name, url: `/workflow-execution/${w.id}` })),
      ...(compliance.data || []).map(c => ({ type: "compliance", data: c, title: c.report_title, url: `/compliance/reports/${c.id}` })),
      ...(cmdb.data || []).map(i => ({ type: "cmdb", data: i, title: i.name, url: `/cmdb/items/${i.id}` })),
      ...(knowledge.data || []).map(k => ({ type: "knowledge", data: k, title: k.title, url: `/knowledge/${k.id}` })),
      ...(changeRecords.data || []).map(cr => ({ type: "change", data: cr, title: cr.title, url: `/change-management/${cr.id}` })),
      ...(anomalies.data || []).map(a => ({ type: "anomaly", data: a, title: `${a.anomaly_type} - ${a.system_name}`, url: `/dashboard/soc` })),
      ...(auditLogs.data || []).map(al => ({ type: "audit", data: al, title: `${al.action_type} - ${al.system_name}`, url: `/compliance/audit-reports` })),
      ...(users.data || []).map(u => ({ type: "user", data: u, title: u.full_name, url: `/employee-directory` })),
      ...(applications.data || []).map(app => ({ type: "application", data: app, title: app.name, url: `/admin/applications` })),
      ...(tenants.data || []).map(t => ({ type: "tenant", data: t, title: t.tenant_name, url: `/cipp` })),
      ...(onboardings.data || []).map(o => ({ type: "onboarding", data: o, title: `${o.client_name} Onboarding`, url: `/onboarding` })),
      ...(complianceFrameworks.data || []).map(cf => ({ type: "framework", data: cf, title: cf.framework_name, url: `/compliance/frameworks/${cf.id}` })),
      ...(aiInteractions.data || []).map(ai => ({ type: "ai-chat", data: ai, title: ai.user_query.substring(0, 50) + "...", url: `/intelligent-assistant` })),
      ...(projects.data || []).map(p => ({ type: "project", data: p, title: p.project_name, url: `/project-management` })),
      ...(vendors.data || []).map(v => ({ type: "vendor", data: v, title: v.vendor_name, url: `/vendor-management/${v.id}` })),
      ...(budgets.data || []).map(b => ({ type: "budget", data: b, title: b.budget_name, url: `/budget-tracking` })),
      ...(incidents.data || []).map(i => ({ type: "incident", data: i, title: `${i.incident_number}: ${i.title}`, url: `/incidents/${i.id}` })),
      ...(serviceRequests.data || []).map(sr => ({ type: "service-request", data: sr, title: `${sr.request_number}: ${sr.title}`, url: `/service-requests` })),
      ...(leads.data || []).map(l => ({ type: "lead", data: l, title: l.lead_name, url: `/sales/leads` })),
      ...(opportunities.data || []).map(o => ({ type: "opportunity", data: o, title: o.opportunity_name, url: `/sales/opportunities` })),
      ...(quotes.data || []).map(q => ({ type: "quote", data: q, title: `Quote ${q.quote_number}`, url: `/sales/quotes` })),
      ...(purchaseOrders.data || []).map(po => ({ type: "purchase-order", data: po, title: `PO ${po.po_number}`, url: `/purchase-orders` })),
      ...(invoices.data || []).map(inv => ({ type: "invoice", data: inv, title: `Invoice ${inv.invoice_number}`, url: `/invoice-management` })),
      ...(expenses.data || []).map(exp => ({ type: "expense", data: exp, title: `Expense ${exp.expense_number}`, url: `/expense-management` })),
      ...(employeeOnboardings.data || []).map(eo => ({ type: "employee-onboarding", data: eo, title: `${eo.employee_name} Onboarding`, url: `/hr/employee-onboarding/${eo.id}` })),
      ...(contracts.data || []).map(c => ({ type: "contract", data: c, title: c.contract_title, url: `/contract-management` })),
      ...(configItems.data || []).map(ci => ({ type: "config-item", data: ci, title: ci.ci_name, url: `/cmdb/items/${ci.id}` })),
      ...(cippPolicies.data || []).map(cp => ({ type: "cipp-policy", data: cp, title: cp.policy_name, url: `/cipp` })),
      ...(products.data || []).map(p => ({ type: "product", data: p, title: p.product_name, url: `/admin/products` })),
      ...(customerAccounts.data || []).map(ca => ({ type: "customer-account", data: ca, title: ca.account_name, url: `/customer-accounts/${ca.id}` })),
      ...staticPages,
    ];

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

    return new Response(JSON.stringify({ results: allResults }), {
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
