-- Ensure sanitize triggers on template tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sanitize_compliance_roadmap_stage_template'
  ) THEN
    CREATE TRIGGER tr_sanitize_compliance_roadmap_stage_template
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stage_templates
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage_template();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sanitize_compliance_roadmap_milestone_template'
  ) THEN
    CREATE TRIGGER tr_sanitize_compliance_roadmap_milestone_template
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestone_templates
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone_template();
  END IF;
END$$;

-- Re-sanitize all existing templates to be safe
UPDATE public.compliance_roadmap_stage_templates
SET 
  stage_name = SUBSTRING(strip_control_chars(stage_name) FOR 200),
  stage_description = CASE WHEN stage_description IS NOT NULL THEN SUBSTRING(strip_control_chars(stage_description) FOR 2000) ELSE NULL END,
  stage_type = SUBSTRING(strip_control_chars(COALESCE(stage_type, 'assessment')) FOR 50);

UPDATE public.compliance_roadmap_milestone_templates
SET 
  milestone_name = SUBSTRING(strip_control_chars(milestone_name) FOR 200),
  milestone_description = CASE WHEN milestone_description IS NOT NULL THEN SUBSTRING(strip_control_chars(milestone_description) FOR 2000) ELSE NULL END,
  required_actions = public.sanitize_text_array(required_actions),
  success_criteria = public.sanitize_text_array(success_criteria);