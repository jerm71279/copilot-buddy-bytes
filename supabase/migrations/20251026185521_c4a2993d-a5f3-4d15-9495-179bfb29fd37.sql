-- Create TEST_CLEAN framework (now that trigger is fixed)
INSERT INTO compliance_frameworks (
  id,
  framework_code,
  framework_name,
  industry,
  description,
  version,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'TEST_CLEAN',
  'Test Clean Framework',
  'Technology',
  'Minimal test framework with clean data for debugging',
  '1.0',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Create one clean stage template
INSERT INTO compliance_roadmap_stage_templates (
  id,
  framework_id,
  stage_number,
  stage_name,
  stage_description,
  stage_type,
  estimated_duration_days
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  1,
  'Test Stage',
  'This is a clean test stage with no special characters',
  'assessment',
  7
)
ON CONFLICT (id) DO NOTHING;

-- Create one clean milestone template (include framework_id)
INSERT INTO compliance_roadmap_milestone_templates (
  id,
  stage_template_id,
  framework_id,
  milestone_name,
  milestone_description,
  sequence_order,
  required_actions,
  success_criteria,
  evidence_required
) VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Milestone',
  'This is a clean test milestone with no special characters',
  1,
  ARRAY['Complete test action']::text[],
  ARRAY['Test criteria met']::text[],
  false
)
ON CONFLICT (id) DO NOTHING;