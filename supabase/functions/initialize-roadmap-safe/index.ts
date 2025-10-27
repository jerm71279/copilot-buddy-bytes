// Edge function: initialize-roadmap-safe
// Purpose: defensively sanitize relevant template data for a framework, then
// call the roadmap initializer RPC with rich diagnostics. Uses service role.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitRequestBody {
  frameworkId: string;
  customerId: string;
  // When true, performs a pre-sanitize pass on template tables for this framework
  preprocess?: boolean;
}

function isUuid(v: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
}

function stripControl(input: unknown, max = 2000): string | null {
  if (input == null) return null;
  const s = String(input);
  const cleaned = s.replace(/[\x00-\x1F\x7F]+/g, '').trim();
  return cleaned.substring(0, max);
}

function sanitizeTextArray(arr: unknown, maxItems = 50, maxLen = 200): string[] | null {
  if (!Array.isArray(arr)) return null;
  const out: string[] = [];
  for (let i = 0; i < arr.length && out.length < maxItems; i++) {
    const v = stripControl(arr[i], maxLen);
    if (v && v.length > 0) out.push(v);
  }
  return out.length ? out : null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Service configuration missing' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: InitRequestBody | null = null;
  try {
    body = (await req.json()) as InitRequestBody;
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const frameworkId = body?.frameworkId || '';
  const customerId = body?.customerId || '';
  const preprocess = body?.preprocess !== false; // default true

  if (!isUuid(frameworkId) || !isUuid(customerId)) {
    return new Response(JSON.stringify({ error: 'frameworkId and customerId must be UUIDs' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const diagnostics: Record<string, unknown> = { frameworkId, preprocess };

    if (preprocess) {
      // Pre-sanitize templates for this framework
      let stageSanitized = 0;
      let milestoneSanitized = 0;

      const { data: stages, error: stErr } = await supabase
        .from('compliance_roadmap_stage_templates')
        .select('id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days')
        .eq('framework_id', frameworkId);
      if (stErr) throw stErr;

      for (const st of stages ?? []) {
        const sanitized = {
          stage_name: stripControl(st.stage_name, 200) || `Stage ${st.stage_number}`,
          stage_description: stripControl(st.stage_description, 2000),
          stage_type: (stripControl(st.stage_type, 50) || 'assessment') as string,
          estimated_duration_days:
            Number.isFinite(st.estimated_duration_days) && st.estimated_duration_days > 0
              ? st.estimated_duration_days
              : 7,
        };
        const changed =
          sanitized.stage_name !== st.stage_name ||
          sanitized.stage_description !== st.stage_description ||
          sanitized.stage_type !== st.stage_type ||
          sanitized.estimated_duration_days !== st.estimated_duration_days;
        if (changed) {
          const { error: uErr } = await supabase
            .from('compliance_roadmap_stage_templates')
            .update(sanitized)
            .eq('id', st.id);
          if (uErr) throw uErr;
          stageSanitized++;
        }
      }

      const { data: mtemps, error: mtErr } = await supabase
        .from('compliance_roadmap_milestone_templates')
        .select('id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required')
        .eq('framework_id', frameworkId);
      if (mtErr) throw mtErr;

      for (const mt of mtemps ?? []) {
        const sanitized = {
          milestone_name: stripControl(mt.milestone_name, 200) || `Milestone ${mt.sequence_order}`,
          milestone_description: stripControl(mt.milestone_description, 2000),
          required_actions: sanitizeTextArray(mt.required_actions),
          success_criteria: sanitizeTextArray(mt.success_criteria),
          evidence_required: !!mt.evidence_required,
        } as Record<string, unknown>;

        const ra = Array.isArray(mt.required_actions) ? mt.required_actions : null;
        const sc = Array.isArray(mt.success_criteria) ? mt.success_criteria : null;

        const changed =
          sanitized.milestone_name !== mt.milestone_name ||
          sanitized.milestone_description !== mt.milestone_description ||
          JSON.stringify(sanitized.required_actions) !== JSON.stringify(ra) ||
          JSON.stringify(sanitized.success_criteria) !== JSON.stringify(sc) ||
          sanitized.evidence_required !== mt.evidence_required;

        if (changed) {
          const { error: uErr } = await supabase
            .from('compliance_roadmap_milestone_templates')
            .update(sanitized)
            .eq('id', mt.id);
          if (uErr) throw uErr;
          milestoneSanitized++;
        }
      }

      diagnostics.stageTemplatesSanitized = stageSanitized;
      diagnostics.milestoneTemplatesSanitized = milestoneSanitized;
    }

    // Attempt initialization RPC
    const { data, error } = await supabase.rpc('initialize_compliance_roadmap', {
      _framework_id: frameworkId,
      _customer_id: customerId,
    });

    if (error) {
      // Gather quick diagnostics about potential control chars remaining in templates
      const { data: suspectStages } = await supabase
        .from('compliance_roadmap_stage_templates')
        .select('id, stage_name, stage_description')
        .eq('framework_id', frameworkId);
      const { data: suspectMilestones } = await supabase
        .from('compliance_roadmap_milestone_templates')
        .select('id, milestone_name, milestone_description')
        .eq('framework_id', frameworkId);

      const containsNull = (s?: string | null) => (s ? /\u0000/.test(JSON.stringify(s)) : false);

      diagnostics.suspectStages = (suspectStages ?? []).filter(
        (s: any) => containsNull(s.stage_name) || containsNull(s.stage_description)
      ).length;
      diagnostics.suspectMilestones = (suspectMilestones ?? []).filter(
        (m: any) => containsNull(m.milestone_name) || containsNull(m.milestone_description)
      ).length;

      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            message: error.message,
            details: (error as any).details ?? null,
            hint: (error as any).hint ?? null,
            code: (error as any).code ?? null,
          },
          diagnostics,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, diagnostics }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('initialize-roadmap-safe error:', error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
