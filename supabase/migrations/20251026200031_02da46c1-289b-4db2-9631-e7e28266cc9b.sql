-- Fix initialize_compliance_roadmap: avoid multi-row RETURNING INTO error and reliably capture first inserted stage id + count
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
  -- Insert stages from templates and capture first id and total inserted in one statement
  WITH ins AS (
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
      st.stage_number,
      COALESCE(st.stage_name, 'Stage'),
      COALESCE(st.stage_description, ''),
      COALESCE(st.stage_type, 'assessment'),
      COALESCE(st.estimated_duration_days, 7),
      'not_started',
      0
    FROM compliance_roadmap_stage_templates st
    WHERE st.framework_id = _framework_id
    ORDER BY st.stage_number
    RETURNING id, stage_number
  )
  SELECT id, cnt
  INTO first_stage_id, stage_count
  FROM (
    SELECT id, stage_number, (SELECT COUNT(*) FROM ins) AS cnt
    FROM ins
  ) t
  ORDER BY stage_number
  LIMIT 1;

  IF COALESCE(stage_count, 0) = 0 THEN
    RAISE EXCEPTION 'No stage templates found for framework %', _framework_id;
  END IF;

  -- Insert milestones from templates for the newly created stages
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
    COALESCE(mt.milestone_name, 'Milestone'),
    COALESCE(mt.milestone_description, ''),
    mt.required_actions,
    mt.success_criteria,
    COALESCE(mt.evidence_required, false),
    'pending'
  FROM compliance_roadmap_stages s
  JOIN compliance_roadmap_stage_templates st 
    ON st.framework_id = _framework_id 
   AND st.stage_number = s.stage_number
  JOIN compliance_roadmap_milestone_templates mt 
    ON mt.stage_template_id = st.id
  WHERE s.framework_id = _framework_id
    AND s.customer_id = _customer_id
  ORDER BY s.stage_number, mt.sequence_order;

  RETURN first_stage_id;
END;
$function$;
