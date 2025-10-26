-- Harden initialize_compliance_roadmap against control chars/null bytes in templates
CREATE OR REPLACE FUNCTION public.initialize_compliance_roadmap(_framework_id uuid, _customer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  first_stage_id UUID;
  stage_count INTEGER := 0;
BEGIN
  -- Clean stage template data in a CTE before inserting
  WITH st_clean AS (
    SELECT 
      st.stage_number,
      SUBSTRING(public.strip_control_chars(COALESCE(st.stage_name, 'Stage')) FOR 200) AS stage_name,
      SUBSTRING(public.strip_control_chars(COALESCE(st.stage_description, '')) FOR 2000) AS stage_description,
      SUBSTRING(public.strip_control_chars(COALESCE(st.stage_type, 'assessment')) FOR 50) AS stage_type,
      COALESCE(st.estimated_duration_days, 7) AS estimated_duration_days
    FROM public.compliance_roadmap_stage_templates st
    WHERE st.framework_id = _framework_id
    ORDER BY st.stage_number
  ), ins AS (
    INSERT INTO public.compliance_roadmap_stages (
      framework_id,
      customer_id,
      stage_number,
      stage_name,
      stage_description,
      stage_type,
      estimated_duration_days,
      status,
      progress_percentage
    )
    SELECT
      _framework_id,
      _customer_id,
      c.stage_number,
      c.stage_name,
      c.stage_description,
      c.stage_type,
      c.estimated_duration_days,
      'not_started',
      0
    FROM st_clean c
    RETURNING id, stage_number
  )
  SELECT id, cnt
  INTO first_stage_id, stage_count
  FROM (
    SELECT id, stage_number, (SELECT COUNT(*) FROM ins) AS cnt FROM ins
  ) t
  ORDER BY stage_number
  LIMIT 1;

  IF COALESCE(stage_count, 0) = 0 THEN
    RAISE EXCEPTION 'No stage templates found for framework %', _framework_id;
  END IF;

  -- Insert milestones using sanitized values
  INSERT INTO public.compliance_roadmap_milestones (
    stage_id,
    customer_id,
    sequence_order,
    milestone_name,
    milestone_description,
    required_actions,
    success_criteria,
    evidence_required,
    status
  )
  SELECT
    s.id,
    _customer_id,
    COALESCE(mt.sequence_order, 1),
    SUBSTRING(public.strip_control_chars(COALESCE(mt.milestone_name, 'Milestone')) FOR 200) AS milestone_name,
    SUBSTRING(public.strip_control_chars(COALESCE(mt.milestone_description, '')) FOR 2000) AS milestone_description,
    public.sanitize_text_array(mt.required_actions) AS required_actions,
    public.sanitize_text_array(mt.success_criteria) AS success_criteria,
    COALESCE(mt.evidence_required, false) AS evidence_required,
    'pending' AS status
  FROM public.compliance_roadmap_stages s
  JOIN public.compliance_roadmap_stage_templates st
    ON st.framework_id = _framework_id
   AND st.stage_number = s.stage_number
  JOIN public.compliance_roadmap_milestone_templates mt
    ON mt.stage_template_id = st.id
  WHERE s.framework_id = _framework_id
    AND s.customer_id = _customer_id
  ORDER BY s.stage_number, mt.sequence_order;

  RETURN first_stage_id;
END;
$function$;

-- Add sanitize triggers if missing to keep future inserts clean
DO $$
BEGIN
  -- Stages sanitize trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_crm_stage'
  ) THEN
    CREATE TRIGGER trg_sanitize_crm_stage
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stages
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage();
  END IF;

  -- Milestones sanitize trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_crm_milestone'
  ) THEN
    CREATE TRIGGER trg_sanitize_crm_milestone
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestones
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone();
  END IF;
END$$;