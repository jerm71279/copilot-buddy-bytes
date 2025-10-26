-- Attach sanitization trigger to compliance_roadmap_stages and clean existing data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_compliance_roadmap_stage'
  ) THEN
    CREATE TRIGGER trg_sanitize_compliance_roadmap_stage
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stages
    FOR EACH ROW
    EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage();
  END IF;
END$$;

-- Clean any existing problematic control characters just in case
UPDATE public.compliance_roadmap_stages
SET 
  stage_name = SUBSTRING(public.strip_control_chars(stage_name) FOR 200),
  stage_description = SUBSTRING(public.strip_control_chars(stage_description) FOR 2000)
WHERE
  stage_name ~ '[\x00-\x1F\x7F]' OR stage_description ~ '[\x00-\x1F\x7F]';