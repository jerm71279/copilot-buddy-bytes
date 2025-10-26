-- 1) Helper: ensure sanitize_text_array exists (idempotent)
CREATE OR REPLACE FUNCTION public.sanitize_text_array(input text[])
RETURNS text[]
LANGUAGE sql
STABLE
AS $$
  SELECT CASE WHEN $1 IS NULL THEN NULL ELSE ARRAY(
    SELECT SUBSTRING(strip_control_chars(x) FOR 200)
    FROM unnest($1) AS x
  ) END
$$;

-- 2) Create or replace runtime sanitizer for milestones
CREATE OR REPLACE FUNCTION public.sanitize_compliance_roadmap_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.milestone_name IS NOT NULL THEN
    NEW.milestone_name := SUBSTRING(strip_control_chars(NEW.milestone_name) FOR 200);
  END IF;

  IF NEW.milestone_description IS NOT NULL THEN
    NEW.milestone_description := SUBSTRING(strip_control_chars(NEW.milestone_description) FOR 2000);
  END IF;

  NEW.required_actions := public.sanitize_text_array(NEW.required_actions);
  NEW.success_criteria := public.sanitize_text_array(NEW.success_criteria);

  -- Sanitize status defensively and cap length
  NEW.status := SUBSTRING(strip_control_chars(COALESCE(NEW.status, 'pending')) FOR 50);

  RETURN NEW;
END;
$$;

-- 3) Ensure trigger exists on runtime milestones table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sanitize_compliance_roadmap_milestone'
  ) THEN
    CREATE TRIGGER tr_sanitize_compliance_roadmap_milestone
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestones
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone();
  END IF;
END$$;

-- 4) Ensure trigger exists on runtime stages table (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sanitize_compliance_roadmap_stage'
  ) THEN
    CREATE TRIGGER tr_sanitize_compliance_roadmap_stage
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stages
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage();
  END IF;
END$$;

-- 5) Backfill sanitize existing runtime rows (stages)
UPDATE public.compliance_roadmap_stages
SET 
  stage_name = SUBSTRING(strip_control_chars(stage_name) FOR 200),
  stage_description = CASE WHEN stage_description IS NOT NULL THEN SUBSTRING(strip_control_chars(stage_description) FOR 2000) ELSE NULL END,
  stage_type = SUBSTRING(strip_control_chars(COALESCE(stage_type, 'assessment')) FOR 50),
  status = SUBSTRING(strip_control_chars(COALESCE(status, 'not_started')) FOR 50)
WHERE TRUE;

-- 6) Backfill sanitize existing runtime rows (milestones)
UPDATE public.compliance_roadmap_milestones
SET 
  milestone_name = SUBSTRING(strip_control_chars(milestone_name) FOR 200),
  milestone_description = CASE WHEN milestone_description IS NOT NULL THEN SUBSTRING(strip_control_chars(milestone_description) FOR 2000) ELSE NULL END,
  required_actions = public.sanitize_text_array(required_actions),
  success_criteria = public.sanitize_text_array(success_criteria),
  status = SUBSTRING(strip_control_chars(COALESCE(status, 'pending')) FOR 50)
WHERE TRUE;

-- 7) Sanitize existing template data defensively
UPDATE public.compliance_roadmap_stage_templates
SET 
  stage_name = SUBSTRING(strip_control_chars(stage_name) FOR 200),
  stage_description = CASE WHEN stage_description IS NOT NULL THEN SUBSTRING(strip_control_chars(stage_description) FOR 2000) ELSE NULL END,
  stage_type = SUBSTRING(strip_control_chars(COALESCE(stage_type, 'assessment')) FOR 50)
WHERE TRUE;

UPDATE public.compliance_roadmap_milestone_templates
SET 
  milestone_name = SUBSTRING(strip_control_chars(milestone_name) FOR 200),
  milestone_description = CASE WHEN milestone_description IS NOT NULL THEN SUBSTRING(strip_control_chars(milestone_description) FOR 2000) ELSE NULL END,
  required_actions = public.sanitize_text_array(required_actions),
  success_criteria = public.sanitize_text_array(success_criteria)
WHERE TRUE;