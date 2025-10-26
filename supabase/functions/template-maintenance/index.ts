// Edge function: template-maintenance
// Provides two maintenance actions for roadmap templates:
// - sanitize: Clean control characters and normalize values in template tables
// - rebuild: Insert minimal clean default templates for every active framework
// Uses service role to bypass RLS for maintenance tasks.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'sanitize' | 'rebuild';

interface RequestBody {
  action: Action;
  frameworkIds?: string[]; // Optional filter list; empty means all active
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

function isUuid(v: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
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

  let body: RequestBody | null = null;
  try {
    body = (await req.json()) as RequestBody;
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const action = body?.action;
  const frameworkIds = Array.isArray(body?.frameworkIds)
    ? body!.frameworkIds.filter((x) => typeof x === 'string' && isUuid(x))
    : [];

  if (action !== 'sanitize' && action !== 'rebuild') {
    return new Response(JSON.stringify({ error: 'action must be "sanitize" or "rebuild"' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (action === 'sanitize') {
      // Sanitize Stage Templates
      const { data: stages, error: stErr } = await supabase
        .from('compliance_roadmap_stage_templates')
        .select('id, framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days');
      if (stErr) throw stErr;

      let stageUpdated = 0;
      if (stages && stages.length) {
        for (const st of stages) {
          const sanitized = {
            stage_name: stripControl(st.stage_name, 200) || `Stage ${st.stage_number}`,
            stage_description: stripControl(st.stage_description, 2000),
            stage_type: (stripControl(st.stage_type, 50) || 'assessment') as string,
            estimated_duration_days: Number.isFinite(st.estimated_duration_days) && st.estimated_duration_days > 0 ? st.estimated_duration_days : 7,
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
            stageUpdated++;
          }
        }
      }

      // Sanitize Milestone Templates
      const { data: mtemps, error: mtErr } = await supabase
        .from('compliance_roadmap_milestone_templates')
        .select('id, stage_template_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required');
      if (mtErr) throw mtErr;

      let milestoneUpdated = 0;
      if (mtemps && mtemps.length) {
        for (const mt of mtemps) {
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
            milestoneUpdated++;
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true, action, updated: { stageTemplates: stageUpdated, milestoneTemplates: milestoneUpdated } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // action === 'rebuild'
    // Create minimal clean defaults for each active framework (or provided ids)
    const fwQuery = supabase
      .from('compliance_frameworks')
      .select('id, framework_name, framework_code, is_active');

    const { data: frameworks, error: fwErr } = frameworkIds.length
      ? await fwQuery.in('id', frameworkIds)
      : await fwQuery.eq('is_active', true);

    if (fwErr) throw fwErr;

    let stagesInserted = 0;
    let milestonesInserted = 0;

    for (const fw of frameworks ?? []) {
      // Remove any existing templates for this framework to ensure a true rebuild
      const { data: existingStages, error: exSErr } = await supabase
        .from('compliance_roadmap_stage_templates')
        .select('id')
        .eq('framework_id', fw.id);
      if (exSErr) throw exSErr;

      if ((existingStages?.length ?? 0) > 0) {
        const stageIds = existingStages!.map((s: { id: string }) => s.id);
        // Delete milestone templates first due to FK
        const { error: delMErr } = await supabase
          .from('compliance_roadmap_milestone_templates')
          .delete()
          .in('stage_template_id', stageIds);
        if (delMErr) throw delMErr;

        // Now delete stage templates
        const { error: delSErr } = await supabase
          .from('compliance_roadmap_stage_templates')
          .delete()
          .eq('framework_id', fw.id);
        if (delSErr) throw delSErr;
      }

      // Insert 3 standard stage templates
      const stageTemplates = [
        {
          framework_id: fw.id,
          stage_number: 1,
          stage_name: stripControl('Assessment', 200),
          stage_description: stripControl('Baseline assessment of current controls and gaps', 2000),
          stage_type: 'assessment',
          estimated_duration_days: 7,
        },
        {
          framework_id: fw.id,
          stage_number: 2,
          stage_name: stripControl('Implementation', 200),
          stage_description: stripControl('Implement required controls and processes', 2000),
          stage_type: 'implementation',
          estimated_duration_days: 21,
        },
        {
          framework_id: fw.id,
          stage_number: 3,
          stage_name: stripControl('Audit Preparation', 200),
          stage_description: stripControl('Evidence collection, testing, and final readiness', 2000),
          stage_type: 'audit_prep',
          estimated_duration_days: 14,
        },
      ];

      const { data: insertedStages, error: insSErr } = await supabase
        .from('compliance_roadmap_stage_templates')
        .insert(stageTemplates)
        .select('id, stage_number');
      if (insSErr) throw insSErr;
      stagesInserted += insertedStages?.length ?? 0;

      // Build milestone templates for each stage
      for (const st of insertedStages ?? []) {
        let milestones;
        if (st.stage_number === 1) {
          milestones = [
            {
              stage_template_id: st.id,
              framework_id: fw.id,
              sequence_order: 1,
              milestone_name: stripControl('Define scope and inventory', 200),
              milestone_description: stripControl('Define in-scope systems and data; inventory assets', 2000),
              required_actions: sanitizeTextArray(['Collect system inventory', 'Identify data flows']) ,
              success_criteria: sanitizeTextArray(['Scope documented', 'Inventory completed']),
              evidence_required: true,
            },
            {
              stage_template_id: st.id,
              framework_id: fw.id,
              sequence_order: 2,
              milestone_name: stripControl('Gap analysis', 200),
              milestone_description: stripControl('Analyze controls vs. framework requirements', 2000),
              required_actions: sanitizeTextArray(['Map controls to requirements']) ,
              success_criteria: sanitizeTextArray(['Gap report produced']),
              evidence_required: false,
            },
          ];
        } else if (st.stage_number === 2) {
          milestones = [
            {
              stage_template_id: st.id,
              framework_id: fw.id,
              sequence_order: 1,
              milestone_name: stripControl('Implement controls', 200),
              milestone_description: stripControl('Roll out prioritized controls and procedures', 2000),
              required_actions: sanitizeTextArray(['Deploy MFA', 'Harden endpoints']) ,
              success_criteria: sanitizeTextArray(['Controls operational']),
              evidence_required: true,
            },
            {
              stage_template_id: st.id,
              framework_id: fw.id,
              sequence_order: 2,
              milestone_name: stripControl('Document policies and SOPs', 200),
              milestone_description: stripControl('Publish and communicate policies', 2000),
              required_actions: sanitizeTextArray(['Draft policies', 'Run approvals']) ,
              success_criteria: sanitizeTextArray(['Policies published']),
              evidence_required: true,
            },
          ];
        } else {
          milestones = [
            {
              stage_template_id: st.id,
              framework_id: fw.id,
              sequence_order: 1,
              milestone_name: stripControl('Collect evidence', 200),
              milestone_description: stripControl('Gather artifacts and screenshots', 2000),
              required_actions: sanitizeTextArray(['Export logs', 'Take screenshots']) ,
              success_criteria: sanitizeTextArray(['Evidence repository complete']),
              evidence_required: true,
            },
            {
              stage_template_id: st.id,
              framework_id: fw.id,
              sequence_order: 2,
              milestone_name: stripControl('Internal readiness review', 200),
              milestone_description: stripControl('Run internal audit and fix gaps', 2000),
              required_actions: sanitizeTextArray(['Perform testing', 'Remediate findings']) ,
              success_criteria: sanitizeTextArray(['All critical gaps closed']),
              evidence_required: false,
            },
          ];
        }

        const milestonesWithFw = (milestones as any[]).map((m) => ({ framework_id: fw.id, ...m }));
        const { data: insM, error: insMErr } = await supabase
          .from('compliance_roadmap_milestone_templates')
          .insert(milestonesWithFw)
          .select('id');
        if (insMErr) throw insMErr;
        milestonesInserted += insM?.length ?? 0;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, action, inserted: { stageTemplates: stagesInserted, milestoneTemplates: milestonesInserted } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('template-maintenance error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});