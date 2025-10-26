-- Nuclear option: Delete all templates and recreate with clean data
TRUNCATE TABLE public.compliance_roadmap_milestone_templates CASCADE;
TRUNCATE TABLE public.compliance_roadmap_stage_templates CASCADE;

-- Recreate stage templates for PCI DSS as test case with fully clean data
INSERT INTO public.compliance_roadmap_stage_templates (
  framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days
) VALUES
  ('f8514423-e7df-4158-a6d3-d387f52a5baf', 1, 'Assessment', 'Initial assessment phase', 'assessment', 14),
  ('f8514423-e7df-4158-a6d3-d387f52a5baf', 2, 'Gap Analysis', 'Identify gaps in compliance', 'gap_analysis', 21),
  ('f8514423-e7df-4158-a6d3-d387f52a5baf', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('f8514423-e7df-4158-a6d3-d387f52a5baf', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('f8514423-e7df-4158-a6d3-d387f52a5baf', 5, 'Testing', 'Test implemented controls', 'testing', 30),
  ('f8514423-e7df-4158-a6d3-d387f52a5baf', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('f8514423-e7df-4158-a6d3-d387f52a5baf', 7, 'Certification', 'Final certification', 'certification', 14);