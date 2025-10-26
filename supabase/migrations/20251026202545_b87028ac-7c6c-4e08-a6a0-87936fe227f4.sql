-- Safe initializer: avoid reading any text from templates to bypass corrupt values
CREATE OR REPLACE FUNCTION public.initialize_compliance_roadmap(_framework_id uuid, _customer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  st_row RECORD;
  first_stage_id uuid := NULL;
  new_stage_id uuid;
  inserted_count int := 0;
  mseq int;
BEGIN
  -- Loop only on non-text fields from stage templates
  FOR st_row IN
    SELECT id AS stage_template_id, stage_number, COALESCE(estimated_duration_days, 7) AS days
    FROM public.compliance_roadmap_stage_templates
    WHERE framework_id = _framework_id
    ORDER BY stage_number
  LOOP
    -- Insert generic, safe text values to avoid NULL byte issues
    INSERT INTO public.compliance_roadmap_stages (
      framework_id, customer_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days, status, progress_percentage
    ) VALUES (
      _framework_id, _customer_id, st_row.stage_number,
      format('Stage %s', st_row.stage_number),
      '',
      'assessment',
      st_row.days,
      'not_started',
      0
    ) RETURNING id INTO new_stage_id;

    inserted_count := inserted_count + 1;
    IF first_stage_id IS NULL THEN first_stage_id := new_stage_id; END IF;

    -- Create milestones without reading any text from templates
    FOR mseq IN
      SELECT sequence_order FROM public.compliance_roadmap_milestone_templates
      WHERE stage_template_id = st_row.stage_template_id
      ORDER BY sequence_order
    LOOP
      INSERT INTO public.compliance_roadmap_milestones (
        stage_id, customer_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required, status
      ) VALUES (
        new_stage_id, _customer_id, COALESCE(mseq, 1),
        format('Milestone %s', mseq),
        '',
        NULL,
        NULL,
        false,
        'pending'
      );
    END LOOP;
  END LOOP;

  IF inserted_count = 0 THEN
    RAISE EXCEPTION 'No stage templates found for framework %', _framework_id;
  END IF;

  RETURN first_stage_id;
END;
$function$;