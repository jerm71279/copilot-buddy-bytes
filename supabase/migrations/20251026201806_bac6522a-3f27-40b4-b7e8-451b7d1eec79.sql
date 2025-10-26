-- Rewrite initialize_compliance_roadmap with per-row inserts and detailed error reporting
CREATE OR REPLACE FUNCTION public.initialize_compliance_roadmap(_framework_id uuid, _customer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  st_rec RECORD;
  mt_rec RECORD;
  first_stage_id UUID := NULL;
  stg_id UUID;
  inserted_count INTEGER := 0;
BEGIN
  -- Loop through sanitized stage templates
  FOR st_rec IN
    SELECT 
      id AS stage_template_id,
      stage_number,
      SUBSTRING(public.strip_control_chars(COALESCE(stage_name, 'Stage')) FOR 200) AS stage_name,
      SUBSTRING(public.strip_control_chars(COALESCE(stage_description, '')) FOR 2000) AS stage_description,
      SUBSTRING(public.strip_control_chars(COALESCE(stage_type, 'assessment')) FOR 50) AS stage_type,
      COALESCE(estimated_duration_days, 7) AS estimated_duration_days
    FROM public.compliance_roadmap_stage_templates
    WHERE framework_id = _framework_id
    ORDER BY stage_number
  LOOP
    BEGIN
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
      ) VALUES (
        _framework_id,
        _customer_id,
        st_rec.stage_number,
        st_rec.stage_name,
        st_rec.stage_description,
        st_rec.stage_type,
        st_rec.estimated_duration_days,
        'not_started',
        0
      ) RETURNING id INTO stg_id;

      inserted_count := inserted_count + 1;
      IF first_stage_id IS NULL THEN
        first_stage_id := stg_id;
      END IF;

      -- Insert milestones one by one with sanitization and fine-grained error reporting
      FOR mt_rec IN
        SELECT 
          sequence_order,
          SUBSTRING(public.strip_control_chars(COALESCE(milestone_name, 'Milestone')) FOR 200) AS milestone_name,
          SUBSTRING(public.strip_control_chars(COALESCE(milestone_description, '')) FOR 2000) AS milestone_description,
          public.sanitize_text_array(required_actions) AS required_actions,
          public.sanitize_text_array(success_criteria) AS success_criteria,
          COALESCE(evidence_required, false) AS evidence_required
        FROM public.compliance_roadmap_milestone_templates
        WHERE stage_template_id = st_rec.stage_template_id
        ORDER BY sequence_order
      LOOP
        BEGIN
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
          ) VALUES (
            stg_id,
            _customer_id,
            COALESCE(mt_rec.sequence_order, 1),
            mt_rec.milestone_name,
            mt_rec.milestone_description,
            mt_rec.required_actions,
            mt_rec.success_criteria,
            mt_rec.evidence_required,
            'pending'
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE EXCEPTION 'Milestone insert failed at stage % (template %), seq %, name %: %',
            st_rec.stage_number, st_rec.stage_template_id, COALESCE(mt_rec.sequence_order, 1), mt_rec.milestone_name, SQLERRM;
        END;
      END LOOP;

    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Stage insert failed at stage_number % (template %), name %: %',
        st_rec.stage_number, st_rec.stage_template_id, st_rec.stage_name, SQLERRM;
    END;
  END LOOP;

  IF inserted_count = 0 THEN
    RAISE EXCEPTION 'No stage templates found for framework %', _framework_id;
  END IF;

  RETURN first_stage_id;
END;
$function$;