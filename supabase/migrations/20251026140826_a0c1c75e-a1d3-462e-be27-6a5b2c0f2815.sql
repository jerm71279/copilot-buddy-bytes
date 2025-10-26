-- Completely rewrite initialize_compliance_roadmap to sanitize every field explicitly
CREATE OR REPLACE FUNCTION public.initialize_compliance_roadmap(_framework_id UUID, _customer_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_stage_id UUID;
  stage_count INTEGER := 0;
BEGIN
  -- Insert stages with explicit sanitization of each field
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
    COALESCE(stage_number, stage_count + 1),
    COALESCE(SUBSTRING(REGEXP_REPLACE(REGEXP_REPLACE(stage_name, E'[\\x00-\\x1F\\x7F]+', '', 'g'), '\\x00', '', 'g') FOR 200), 'Stage'),
    COALESCE(SUBSTRING(REGEXP_REPLACE(REGEXP_REPLACE(stage_description, E'[\\x00-\\x1F\\x7F]+', '', 'g'), '\\x00', '', 'g') FOR 2000), ''),
    COALESCE(SUBSTRING(REGEXP_REPLACE(stage_type, E'[\\x00-\\x1F\\x7F]+', '', 'g') FOR 50), 'assessment'),
    COALESCE(estimated_duration_days, 7),
    'not_started',
    0
  FROM compliance_roadmap_stage_templates
  WHERE framework_id = _framework_id
  ORDER BY stage_number
  RETURNING id INTO first_stage_id;

  GET DIAGNOSTICS stage_count = ROW_COUNT;
  
  -- Insert milestones with explicit sanitization
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
    COALESCE(SUBSTRING(REGEXP_REPLACE(REGEXP_REPLACE(mt.milestone_name, E'[\\x00-\\x1F\\x7F]+', '', 'g'), '\\x00', '', 'g') FOR 200), 'Milestone'),
    COALESCE(SUBSTRING(REGEXP_REPLACE(REGEXP_REPLACE(mt.milestone_description, E'[\\x00-\\x1F\\x7F]+', '', 'g'), '\\x00', '', 'g') FOR 2000), ''),
    CASE 
      WHEN mt.required_actions IS NOT NULL THEN (
        SELECT ARRAY_AGG(SUBSTRING(REGEXP_REPLACE(REGEXP_REPLACE(elem, E'[\\x00-\\x1F\\x7F]+', '', 'g'), '\\x00', '', 'g') FOR 200))
        FROM unnest(mt.required_actions) AS elem
      )
      ELSE NULL
    END,
    CASE 
      WHEN mt.success_criteria IS NOT NULL THEN (
        SELECT ARRAY_AGG(SUBSTRING(REGEXP_REPLACE(REGEXP_REPLACE(elem, E'[\\x00-\\x1F\\x7F]+', '', 'g'), '\\x00', '', 'g') FOR 200))
        FROM unnest(mt.success_criteria) AS elem
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

  IF stage_count = 0 THEN
    RAISE EXCEPTION 'No stage templates found for framework %', _framework_id;
  END IF;

  RETURN first_stage_id;
END;
$$;