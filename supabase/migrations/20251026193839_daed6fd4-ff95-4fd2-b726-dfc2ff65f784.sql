-- Safer initialize_compliance_roadmap without regex patterns and with robust sanitization
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
  -- Insert stages with defensive sanitization
  INSERT INTO compliance_roadmap_stages (
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
    COALESCE(st.stage_number, ROW_NUMBER() OVER (ORDER BY st.stage_number)),
    COALESCE(SUBSTRING(strip_control_chars(st.stage_name) FOR 200), 'Stage'),
    COALESCE(SUBSTRING(strip_control_chars(st.stage_description) FOR 2000), ''),
    COALESCE(SUBSTRING(strip_control_chars(st.stage_type) FOR 50), 'assessment'),
    COALESCE(st.estimated_duration_days, 7),
    'not_started',
    0
  FROM compliance_roadmap_stage_templates st
  WHERE st.framework_id = _framework_id
  ORDER BY st.stage_number
  RETURNING id INTO first_stage_id;

  GET DIAGNOSTICS stage_count = ROW_COUNT;

  IF stage_count = 0 THEN
    RAISE EXCEPTION 'No stage templates found for framework %', _framework_id;
  END IF;

  -- Insert milestones with defensive sanitization
  INSERT INTO compliance_roadmap_milestones (
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
    COALESCE(SUBSTRING(strip_control_chars(mt.milestone_name) FOR 200), 'Milestone'),
    COALESCE(SUBSTRING(strip_control_chars(mt.milestone_description) FOR 2000), ''),
    CASE 
      WHEN mt.required_actions IS NOT NULL THEN (
        SELECT ARRAY(
          SELECT SUBSTRING(strip_control_chars(elem) FOR 200)
          FROM unnest(mt.required_actions) AS elem
          WHERE elem IS NOT NULL
        )
      )
      ELSE NULL
    END,
    CASE 
      WHEN mt.success_criteria IS NOT NULL THEN (
        SELECT ARRAY(
          SELECT SUBSTRING(strip_control_chars(elem) FOR 200)
          FROM unnest(mt.success_criteria) AS elem
          WHERE elem IS NOT NULL
        )
      )
      ELSE NULL
    END,
    COALESCE(mt.evidence_required, false),
    'pending'
  FROM compliance_roadmap_stages s
  JOIN compliance_roadmap_stage_templates st ON st.framework_id = _framework_id AND st.stage_number = s.stage_number
  JOIN compliance_roadmap_milestone_templates mt ON mt.stage_template_id = st.id
  WHERE s.framework_id = _framework_id
    AND s.customer_id = _customer_id
  ORDER BY s.stage_number, mt.sequence_order;

  RETURN first_stage_id;
END;
$function$;

-- Ensure sanitize triggers exist on target tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sanitize_compliance_roadmap_stage') THEN
    CREATE TRIGGER tr_sanitize_compliance_roadmap_stage
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stages
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sanitize_compliance_roadmap_milestone') THEN
    CREATE TRIGGER tr_sanitize_compliance_roadmap_milestone
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestones
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone();
  END IF;
END$$;

-- Re-sanitize all template data just in case
UPDATE public.compliance_roadmap_stage_templates
SET 
  stage_name = SUBSTRING(strip_control_chars(stage_name) FOR 200),
  stage_description = CASE WHEN stage_description IS NOT NULL THEN SUBSTRING(strip_control_chars(stage_description) FOR 2000) ELSE NULL END,
  stage_type = SUBSTRING(strip_control_chars(COALESCE(stage_type, 'assessment')) FOR 50);

UPDATE public.compliance_roadmap_milestone_templates
SET 
  milestone_name = SUBSTRING(strip_control_chars(milestone_name) FOR 200),
  milestone_description = CASE WHEN milestone_description IS NOT NULL THEN SUBSTRING(strip_control_chars(milestone_description) FOR 2000) ELSE NULL END,
  required_actions = public.sanitize_text_array(required_actions),
  success_criteria = public.sanitize_text_array(success_criteria);
