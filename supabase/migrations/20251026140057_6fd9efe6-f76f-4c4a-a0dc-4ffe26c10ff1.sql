-- 1) Helper: sanitize text[] arrays element-wise
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

-- 2) Stage template sanitization trigger
CREATE OR REPLACE FUNCTION public.sanitize_compliance_roadmap_stage_template()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.stage_name IS NOT NULL THEN
    NEW.stage_name := SUBSTRING(strip_control_chars(NEW.stage_name) FOR 200);
  END IF;
  IF NEW.stage_description IS NOT NULL THEN
    NEW.stage_description := SUBSTRING(strip_control_chars(NEW.stage_description) FOR 2000);
  END IF;
  NEW.stage_type := SUBSTRING(strip_control_chars(COALESCE(NEW.stage_type, 'assessment')) FOR 50);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_roadmap_stage_templates'
  ) THEN
    DROP TRIGGER trg_sanitize_roadmap_stage_templates ON public.compliance_roadmap_stage_templates;
  END IF;
END $$;

CREATE TRIGGER trg_sanitize_roadmap_stage_templates
BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stage_templates
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage_template();

-- 3) Milestone template sanitization trigger (includes arrays)
CREATE OR REPLACE FUNCTION public.sanitize_compliance_roadmap_milestone_template()
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
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_roadmap_milestone_templates'
  ) THEN
    DROP TRIGGER trg_sanitize_roadmap_milestone_templates ON public.compliance_roadmap_milestone_templates;
  END IF;
END $$;

CREATE TRIGGER trg_sanitize_roadmap_milestone_templates
BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestone_templates
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone_template();

-- 4) Bulk clean existing template data at the source
UPDATE public.compliance_roadmap_stage_templates
SET 
  stage_name = SUBSTRING(strip_control_chars(stage_name) FOR 200),
  stage_description = SUBSTRING(strip_control_chars(stage_description) FOR 2000),
  stage_type = SUBSTRING(strip_control_chars(COALESCE(stage_type, 'assessment')) FOR 50)
WHERE TRUE;

UPDATE public.compliance_roadmap_milestone_templates
SET 
  milestone_name = SUBSTRING(strip_control_chars(milestone_name) FOR 200),
  milestone_description = SUBSTRING(strip_control_chars(milestone_description) FOR 2000),
  required_actions = public.sanitize_text_array(required_actions),
  success_criteria = public.sanitize_text_array(success_criteria)
WHERE TRUE;

-- 5) Optional: clean any previously inserted roadmap data to ensure consistency
UPDATE public.compliance_roadmap_stages
SET 
  stage_name = SUBSTRING(strip_control_chars(stage_name) FOR 200),
  stage_description = SUBSTRING(strip_control_chars(stage_description) FOR 2000),
  stage_type = SUBSTRING(strip_control_chars(COALESCE(stage_type, 'assessment')) FOR 50),
  status = SUBSTRING(strip_control_chars(COALESCE(status, 'not_started')) FOR 50)
WHERE TRUE;

UPDATE public.compliance_roadmap_milestones
SET 
  milestone_name = SUBSTRING(strip_control_chars(milestone_name) FOR 200),
  milestone_description = SUBSTRING(strip_control_chars(milestone_description) FOR 2000),
  required_actions = public.sanitize_text_array(required_actions),
  success_criteria = public.sanitize_text_array(success_criteria),
  status = SUBSTRING(strip_control_chars(COALESCE(status, 'pending')) FOR 50)
WHERE TRUE;