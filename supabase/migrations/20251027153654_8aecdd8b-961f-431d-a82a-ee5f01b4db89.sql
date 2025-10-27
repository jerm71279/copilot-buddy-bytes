-- Migration: Add sanitize + validate triggers for roadmap tables and templates
-- and strengthen input constraints without CHECKs (use triggers)

-- 1) Ensure sanitize triggers exist on stages/milestones and their templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_roadmap_stage') THEN
    CREATE TRIGGER trg_sanitize_roadmap_stage
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stages
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_roadmap_milestone') THEN
    CREATE TRIGGER trg_sanitize_roadmap_milestone
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestones
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_roadmap_stage_tmpl') THEN
    CREATE TRIGGER trg_sanitize_roadmap_stage_tmpl
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stage_templates
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_stage_template();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitize_roadmap_milestone_tmpl') THEN
    CREATE TRIGGER trg_sanitize_roadmap_milestone_tmpl
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestone_templates
    FOR EACH ROW EXECUTE FUNCTION public.sanitize_compliance_roadmap_milestone_template();
  END IF;
END$$;

-- 2) Add validation triggers to enforce max lengths and array sizes
CREATE OR REPLACE FUNCTION public.validate_roadmap_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.validate_text_input(NEW.stage_name, 200, 'stage_name');
  IF NEW.stage_description IS NOT NULL THEN
    PERFORM public.validate_text_input(NEW.stage_description, 2000, 'stage_description');
  END IF;
  -- Defensive caps on type/status
  IF NEW.stage_type IS NOT NULL THEN
    PERFORM public.validate_text_input(NEW.stage_type, 50, 'stage_type');
  END IF;
  IF NEW.status IS NOT NULL THEN
    PERFORM public.validate_text_input(NEW.status, 50, 'status');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_roadmap_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.validate_text_input(NEW.milestone_name, 200, 'milestone_name');
  IF NEW.milestone_description IS NOT NULL THEN
    PERFORM public.validate_text_input(NEW.milestone_description, 2000, 'milestone_description');
  END IF;
  IF NEW.required_actions IS NOT NULL THEN
    PERFORM public.validate_array_input(NEW.required_actions, 100, 200, 'required_actions');
  END IF;
  IF NEW.success_criteria IS NOT NULL THEN
    PERFORM public.validate_array_input(NEW.success_criteria, 100, 200, 'success_criteria');
  END IF;
  IF NEW.status IS NOT NULL THEN
    PERFORM public.validate_text_input(NEW.status, 50, 'status');
  END IF;
  RETURN NEW;
END;
$$;

-- Attach validation triggers (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_roadmap_stage') THEN
    CREATE TRIGGER trg_validate_roadmap_stage
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stages
    FOR EACH ROW EXECUTE FUNCTION public.validate_roadmap_stage();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_roadmap_milestone') THEN
    CREATE TRIGGER trg_validate_roadmap_milestone
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestones
    FOR EACH ROW EXECUTE FUNCTION public.validate_roadmap_milestone();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_roadmap_stage_tmpl') THEN
    CREATE TRIGGER trg_validate_roadmap_stage_tmpl
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_stage_templates
    FOR EACH ROW EXECUTE FUNCTION public.validate_roadmap_stage();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_roadmap_milestone_tmpl') THEN
    CREATE TRIGGER trg_validate_roadmap_milestone_tmpl
    BEFORE INSERT OR UPDATE ON public.compliance_roadmap_milestone_templates
    FOR EACH ROW EXECUTE FUNCTION public.validate_roadmap_milestone();
  END IF;
END$$;

-- 3) OPTIONAL safety: sanitize any lingering control chars in operational tables now
-- (Unconditional to avoid regex encoding errors)
UPDATE public.compliance_roadmap_stages
SET 
  stage_name = public.strip_control_chars(stage_name),
  stage_description = CASE WHEN stage_description IS NULL THEN NULL ELSE public.strip_control_chars(stage_description) END,
  stage_type = public.strip_control_chars(COALESCE(stage_type, 'assessment')),
  status = public.strip_control_chars(COALESCE(status, 'not_started'));

UPDATE public.compliance_roadmap_milestones
SET 
  milestone_name = public.strip_control_chars(milestone_name),
  milestone_description = CASE WHEN milestone_description IS NULL THEN NULL ELSE public.strip_control_chars(milestone_description) END,
  required_actions = public.sanitize_text_array(required_actions),
  success_criteria = public.sanitize_text_array(success_criteria),
  status = public.strip_control_chars(COALESCE(status, 'pending'));
