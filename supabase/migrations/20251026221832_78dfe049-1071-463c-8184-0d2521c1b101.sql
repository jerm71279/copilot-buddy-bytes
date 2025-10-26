BEGIN;
TRUNCATE TABLE public.compliance_roadmap_milestone_templates RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.compliance_roadmap_stage_templates RESTART IDENTITY CASCADE;
COMMIT;