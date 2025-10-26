-- Create sanitize triggers if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sanitize_compliance_roadmap_stage_trg') THEN
    CREATE TRIGGER sanitize_compliance_roadmap_stage_trg
      BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stages
      FOR EACH ROW
      EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sanitize_compliance_roadmap_milestone_trg') THEN
    CREATE TRIGGER sanitize_compliance_roadmap_milestone_trg
      BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestones
      FOR EACH ROW
      EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sanitize_stage_template_trg') THEN
    CREATE TRIGGER sanitize_stage_template_trg
      BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stage_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage_template();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sanitize_milestone_template_trg') THEN
    CREATE TRIGGER sanitize_milestone_template_trg
      BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestone_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone_template();
  END IF;
END $$;

-- Harden initializer to sanitize on insert
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
  mt_row RECORD;
BEGIN
  FOR st_row IN
    SELECT 
      id AS stage_template_id, 
      stage_number, 
      stage_name,
      stage_description,
      stage_type,
      COALESCE(estimated_duration_days, 7) AS days
    FROM public.compliance_roadmap_stage_templates
    WHERE framework_id = _framework_id
    ORDER BY stage_number
  LOOP
    INSERT INTO public.compliance_roadmap_stages (
      framework_id, customer_id, stage_number, stage_name, stage_description, 
      stage_type, estimated_duration_days, status, progress_percentage
    ) VALUES (
      _framework_id, 
      _customer_id, 
      st_row.stage_number,
      SUBSTRING(strip_control_chars(COALESCE(st_row.stage_name, format('Stage %s', st_row.stage_number))) FOR 200),
      CASE WHEN st_row.stage_description IS NULL THEN NULL ELSE SUBSTRING(strip_control_chars(st_row.stage_description) FOR 2000) END,
      SUBSTRING(strip_control_chars(COALESCE(st_row.stage_type, 'assessment')) FOR 50),
      st_row.days,
      'not_started',
      0
    ) RETURNING id INTO new_stage_id;

    inserted_count := inserted_count + 1;
    IF first_stage_id IS NULL THEN first_stage_id := new_stage_id; END IF;

    -- Create milestones for this stage
    FOR mt_row IN
      SELECT 
        sequence_order,
        milestone_name,
        milestone_description,
        COALESCE(evidence_required, false) AS evidence_req
      FROM public.compliance_roadmap_milestone_templates
      WHERE stage_template_id = st_row.stage_template_id
      ORDER BY sequence_order
    LOOP
      INSERT INTO public.compliance_roadmap_milestones (
        stage_id, customer_id, sequence_order, milestone_name, 
        milestone_description, evidence_required, status
      ) VALUES (
        new_stage_id, 
        _customer_id, 
        mt_row.sequence_order,
        SUBSTRING(strip_control_chars(COALESCE(mt_row.milestone_name, format('Milestone %s', mt_row.sequence_order))) FOR 200),
        CASE WHEN mt_row.milestone_description IS NULL THEN NULL ELSE SUBSTRING(strip_control_chars(mt_row.milestone_description) FOR 2000) END,
        mt_row.evidence_req,
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