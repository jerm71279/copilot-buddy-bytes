-- Targeted fix: overwrite corrupted HIPAA stage template values by ID without reading problematic columns
UPDATE public.compliance_roadmap_stage_templates
SET 
  stage_name = 'HIPAA Scoping',
  stage_description = '',
  stage_type = 'assessment',
  estimated_duration_days = COALESCE(estimated_duration_days, 7)
WHERE id = 'eb97c93e-23f1-4a81-9d57-7223bc98e326'::uuid;

-- Robust initialize function: avoid selecting corrupt text directly; use safe fallbacks on error
CREATE OR REPLACE FUNCTION public.initialize_compliance_roadmap(_framework_id uuid, _customer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  st_id uuid;
  st_num int;
  v_name text;
  v_desc text;
  v_type text;
  v_days int;
  mt_seq int;
  m_name text;
  m_desc text;
  m_req text[];
  m_succ text[];
  m_evid boolean;
  first_stage_id uuid := NULL;
  stg_id uuid;
  inserted_count int := 0;
BEGIN
  FOR st_id, st_num IN
    SELECT id, stage_number
    FROM public.compliance_roadmap_stage_templates
    WHERE framework_id = _framework_id
    ORDER BY stage_number
  LOOP
    -- Attempt to fetch and sanitize stage values; on any error, use safe defaults
    BEGIN
      SELECT 
        SUBSTRING(public.strip_control_chars(COALESCE(stage_name, 'Stage')) FOR 200),
        SUBSTRING(public.strip_control_chars(COALESCE(stage_description, '')) FOR 2000),
        SUBSTRING(public.strip_control_chars(COALESCE(stage_type, 'assessment')) FOR 50),
        COALESCE(estimated_duration_days, 7)
      INTO v_name, v_desc, v_type, v_days
      FROM public.compliance_roadmap_stage_templates
      WHERE id = st_id;
    EXCEPTION WHEN OTHERS THEN
      v_name := format('Stage %s', st_num);
      v_desc := '';
      v_type := 'assessment';
      v_days := 7;
    END;

    -- Insert stage
    INSERT INTO public.compliance_roadmap_stages (
      framework_id, customer_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days, status, progress_percentage
    ) VALUES (
      _framework_id, _customer_id, st_num, v_name, v_desc, v_type, v_days, 'not_started', 0
    ) RETURNING id INTO stg_id;

    inserted_count := inserted_count + 1;
    IF first_stage_id IS NULL THEN first_stage_id := stg_id; END IF;

    -- Milestones: iterate by sequence only; sanitize per field with fallback
    FOR mt_seq IN
      SELECT sequence_order FROM public.compliance_roadmap_milestone_templates WHERE stage_template_id = st_id ORDER BY sequence_order
    LOOP
      BEGIN
        SELECT 
          SUBSTRING(public.strip_control_chars(COALESCE(milestone_name, format('Milestone %s', mt_seq))) FOR 200),
          SUBSTRING(public.strip_control_chars(COALESCE(milestone_description, '')) FOR 2000),
          public.sanitize_text_array(required_actions),
          public.sanitize_text_array(success_criteria),
          COALESCE(evidence_required, false)
        INTO m_name, m_desc, m_req, m_succ, m_evid
        FROM public.compliance_roadmap_milestone_templates
        WHERE stage_template_id = st_id AND sequence_order = mt_seq;
      EXCEPTION WHEN OTHERS THEN
        m_name := format('Milestone %s', mt_seq);
        m_desc := '';
        m_req := NULL;
        m_succ := NULL;
        m_evid := false;
      END;

      INSERT INTO public.compliance_roadmap_milestones (
        stage_id, customer_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required, status
      ) VALUES (
        stg_id, _customer_id, COALESCE(mt_seq, 1), m_name, m_desc, m_req, m_succ, m_evid, 'pending'
      );
    END LOOP;
  END LOOP;

  IF inserted_count = 0 THEN
    RAISE EXCEPTION 'No stage templates found for framework %', _framework_id;
  END IF;

  RETURN first_stage_id;
END;
$function$;