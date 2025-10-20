-- Sanitize control characters in compliance roadmap stages to prevent null byte errors
CREATE OR REPLACE FUNCTION public.strip_control_chars(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(COALESCE(input, ''), '[\x00-\x1F\x7F]+', '', 'g');
$$;

CREATE OR REPLACE FUNCTION public.sanitize_compliance_roadmap_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strip control characters and cap lengths
  IF NEW.stage_name IS NOT NULL THEN
    NEW.stage_name := SUBSTRING(strip_control_chars(NEW.stage_name) FOR 200);
  END IF;

  IF NEW.stage_description IS NOT NULL THEN
    NEW.stage_description := SUBSTRING(strip_control_chars(NEW.stage_description) FOR 2000);
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure it's present
DROP TRIGGER IF EXISTS sanitize_compliance_roadmap_stages_before_insupd ON public.compliance_roadmap_stages;
CREATE TRIGGER sanitize_compliance_roadmap_stages_before_insupd
BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stages
FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage();

-- Clean any existing contaminated rows (idempotent)
UPDATE public.compliance_roadmap_stages
SET 
  stage_name = SUBSTRING(strip_control_chars(stage_name) FOR 200),
  stage_description = SUBSTRING(strip_control_chars(stage_description) FOR 2000)
WHERE TRUE;