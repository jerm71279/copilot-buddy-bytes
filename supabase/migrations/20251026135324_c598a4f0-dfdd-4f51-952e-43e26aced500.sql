-- Make initialize_compliance_roadmap resilient: catch bad template rows and fall back to safe defaults
CREATE OR REPLACE FUNCTION public.initialize_compliance_roadmap(_framework_id uuid, _customer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_stage_id UUID;
  stage_rec RECORD;
  new_stage_id UUID;
  milestone_rec RECORD;
BEGIN
  -- Copy stages from templates with sanitization and robust error handling
  FOR stage_rec IN 
    SELECT * FROM compliance_roadmap_stage_templates 
    WHERE framework_id = _framework_id 
    ORDER BY stage_number
  LOOP
    BEGIN
      INSERT INTO compliance_roadmap_stages (
        framework_id, customer_id, stage_number, stage_name, 
        stage_description, stage_type, estimated_duration_days, status, progress_percentage
      ) VALUES (
        _framework_id, _customer_id, stage_rec.stage_number,
        SUBSTRING(strip_control_chars(stage_rec.stage_name) FOR 200),
        SUBSTRING(strip_control_chars(stage_rec.stage_description) FOR 2000),
        SUBSTRING(strip_control_chars(COALESCE(stage_rec.stage_type, 'assessment')) FOR 50),
        stage_rec.estimated_duration_days,
        'not_started', 0
      ) RETURNING id INTO new_stage_id;
    EXCEPTION WHEN OTHERS THEN
      -- Fallback: insert with safe defaults to bypass problematic data
      RAISE WARNING 'Stage insert failed for template %, falling back: %', stage_rec.id, SQLERRM;
      INSERT INTO compliance_roadmap_stages (
        framework_id, customer_id, stage_number, stage_name, 
        stage_description, stage_type, estimated_duration_days, status, progress_percentage
      ) VALUES (
        _framework_id, _customer_id, stage_rec.stage_number,
        CONCAT('Stage ', COALESCE(stage_rec.stage_number::text, '1')),
        '',
        'assessment',
        COALESCE(stage_rec.estimated_duration_days, 7),
        'not_started', 0
      ) RETURNING id INTO new_stage_id;
    END;
    
    IF first_stage_id IS NULL THEN
      first_stage_id := new_stage_id;
    END IF;
    
    -- Copy milestones for this stage with sanitization and robust error handling
    FOR milestone_rec IN
      SELECT * FROM compliance_roadmap_milestone_templates
      WHERE stage_template_id = stage_rec.id
      ORDER BY sequence_order
    LOOP
      BEGIN
        INSERT INTO compliance_roadmap_milestones (
          stage_id, customer_id, sequence_order, milestone_name,
          milestone_description, required_actions, success_criteria,
          evidence_required, status
        ) VALUES (
          new_stage_id, _customer_id, milestone_rec.sequence_order,
          SUBSTRING(strip_control_chars(milestone_rec.milestone_name) FOR 200),
          SUBSTRING(strip_control_chars(milestone_rec.milestone_description) FOR 2000),
          CASE WHEN milestone_rec.required_actions IS NULL THEN NULL ELSE (
            SELECT ARRAY_AGG(SUBSTRING(strip_control_chars(x) FOR 200))
            FROM unnest(milestone_rec.required_actions) AS x
          ) END,
          CASE WHEN milestone_rec.success_criteria IS NULL THEN NULL ELSE (
            SELECT ARRAY_AGG(SUBSTRING(strip_control_chars(y) FOR 200))
            FROM unnest(milestone_rec.success_criteria) AS y
          ) END,
          COALESCE(milestone_rec.evidence_required, false),
          'pending'
        );
      EXCEPTION WHEN OTHERS THEN
        -- Fallback: insert minimal safe milestone and continue
        RAISE WARNING 'Milestone insert failed for template %, falling back: %', milestone_rec.id, SQLERRM;
        INSERT INTO compliance_roadmap_milestones (
          stage_id, customer_id, sequence_order, milestone_name,
          milestone_description, required_actions, success_criteria,
          evidence_required, status
        ) VALUES (
          new_stage_id, _customer_id, COALESCE(milestone_rec.sequence_order, 1),
          CONCAT('Milestone ', COALESCE(milestone_rec.sequence_order::text, '1')),
          '', NULL, NULL, COALESCE(milestone_rec.evidence_required, false), 'pending'
        );
      END;
    END LOOP;
  END LOOP;
  
  RETURN first_stage_id;
END;
$$;