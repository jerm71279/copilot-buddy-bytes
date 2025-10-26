-- Simplify initializer to isolate null-byte issue: create stages only (no milestones)
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
BEGIN
  -- Create stages based on templates, but skip milestone creation to isolate issue
  FOR st_row IN
    SELECT id AS stage_template_id, stage_number, COALESCE(estimated_duration_days, 7) AS days
    FROM public.compliance_roadmap_stage_templates
    WHERE framework_id = _framework_id
    ORDER BY stage_number
  LOOP
    INSERT INTO public.compliance_roadmap_stages (
      framework_id, customer_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days, status, progress_percentage
    ) VALUES (
      _framework_id, _customer_id, st_row.stage_number,
      SUBSTRING(public.strip_control_chars(format('Stage %s', st_row.stage_number)) FOR 200),
      NULL,
      SUBSTRING(public.strip_control_chars('assessment') FOR 50),
      st_row.days,
      SUBSTRING(public.strip_control_chars('not_started') FOR 50),
      0
    ) RETURNING id INTO new_stage_id;

    inserted_count := inserted_count + 1;
    IF first_stage_id IS NULL THEN first_stage_id := new_stage_id; END IF;
  END LOOP;

  IF inserted_count = 0 THEN
    RAISE EXCEPTION 'No stage templates found for framework %', _framework_id;
  END IF;

  RETURN first_stage_id;
END;
$function$;