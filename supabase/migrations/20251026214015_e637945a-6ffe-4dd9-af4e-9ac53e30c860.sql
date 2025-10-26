-- Recreate stage templates for all active frameworks with clean data
-- Using generic 7-stage compliance journey for each framework

-- SOC 2 (bf88f79f-c7dd-472f-892c-1713d0879fec)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('bf88f79f-c7dd-472f-892c-1713d0879fec', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('bf88f79f-c7dd-472f-892c-1713d0879fec', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('bf88f79f-c7dd-472f-892c-1713d0879fec', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('bf88f79f-c7dd-472f-892c-1713d0879fec', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('bf88f79f-c7dd-472f-892c-1713d0879fec', 5, 'Testing', 'Test controls', 'testing', 30),
  ('bf88f79f-c7dd-472f-892c-1713d0879fec', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('bf88f79f-c7dd-472f-892c-1713d0879fec', 7, 'Certification', 'Final certification', 'certification', 14);

-- ISO/IEC 27001 (0ec74d49-a739-45da-93e5-4bfa9de1c045)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('0ec74d49-a739-45da-93e5-4bfa9de1c045', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('0ec74d49-a739-45da-93e5-4bfa9de1c045', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('0ec74d49-a739-45da-93e5-4bfa9de1c045', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('0ec74d49-a739-45da-93e5-4bfa9de1c045', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('0ec74d49-a739-45da-93e5-4bfa9de1c045', 5, 'Testing', 'Test controls', 'testing', 30),
  ('0ec74d49-a739-45da-93e5-4bfa9de1c045', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('0ec74d49-a739-45da-93e5-4bfa9de1c045', 7, 'Certification', 'Final certification', 'certification', 14);

-- HIPAA (57cae930-13f8-4ae7-8987-29dcb985b46c)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('57cae930-13f8-4ae7-8987-29dcb985b46c', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('57cae930-13f8-4ae7-8987-29dcb985b46c', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('57cae930-13f8-4ae7-8987-29dcb985b46c', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('57cae930-13f8-4ae7-8987-29dcb985b46c', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('57cae930-13f8-4ae7-8987-29dcb985b46c', 5, 'Testing', 'Test controls', 'testing', 30),
  ('57cae930-13f8-4ae7-8987-29dcb985b46c', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('57cae930-13f8-4ae7-8987-29dcb985b46c', 7, 'Certification', 'Final certification', 'certification', 14);

-- SOC 2 Type II (58d93fa1-5088-4f63-8c85-df117c43d32e)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('58d93fa1-5088-4f63-8c85-df117c43d32e', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('58d93fa1-5088-4f63-8c85-df117c43d32e', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('58d93fa1-5088-4f63-8c85-df117c43d32e', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('58d93fa1-5088-4f63-8c85-df117c43d32e', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('58d93fa1-5088-4f63-8c85-df117c43d32e', 5, 'Testing', 'Test controls', 'testing', 30),
  ('58d93fa1-5088-4f63-8c85-df117c43d32e', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('58d93fa1-5088-4f63-8c85-df117c43d32e', 7, 'Certification', 'Final certification', 'certification', 14);

-- FISMA (5a56c656-5204-40d2-a274-afafcbb70dcc)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('5a56c656-5204-40d2-a274-afafcbb70dcc', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('5a56c656-5204-40d2-a274-afafcbb70dcc', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('5a56c656-5204-40d2-a274-afafcbb70dcc', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('5a56c656-5204-40d2-a274-afafcbb70dcc', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('5a56c656-5204-40d2-a274-afafcbb70dcc', 5, 'Testing', 'Test controls', 'testing', 30),
  ('5a56c656-5204-40d2-a274-afafcbb70dcc', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('5a56c656-5204-40d2-a274-afafcbb70dcc', 7, 'Certification', 'Final certification', 'certification', 14);

-- GDPR (5d6550f5-c533-4db4-8861-3298ef5e9fcd)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('5d6550f5-c533-4db4-8861-3298ef5e9fcd', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('5d6550f5-c533-4db4-8861-3298ef5e9fcd', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('5d6550f5-c533-4db4-8861-3298ef5e9fcd', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('5d6550f5-c533-4db4-8861-3298ef5e9fcd', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('5d6550f5-c533-4db4-8861-3298ef5e9fcd', 5, 'Testing', 'Test controls', 'testing', 30),
  ('5d6550f5-c533-4db4-8861-3298ef5e9fcd', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('5d6550f5-c533-4db4-8861-3298ef5e9fcd', 7, 'Certification', 'Final certification', 'certification', 14);

-- CMMC Level 2 (70dbb2f2-309d-4b18-abeb-61b2e6dde713)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('70dbb2f2-309d-4b18-abeb-61b2e6dde713', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('70dbb2f2-309d-4b18-abeb-61b2e6dde713', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('70dbb2f2-309d-4b18-abeb-61b2e6dde713', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('70dbb2f2-309d-4b18-abeb-61b2e6dde713', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('70dbb2f2-309d-4b18-abeb-61b2e6dde713', 5, 'Testing', 'Test controls', 'testing', 30),
  ('70dbb2f2-309d-4b18-abeb-61b2e6dde713', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('70dbb2f2-309d-4b18-abeb-61b2e6dde713', 7, 'Certification', 'Final certification', 'certification', 14);

-- CMMC NIST 800-171 (7a576f20-add3-46f7-8d21-7f7d58db22db)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('7a576f20-add3-46f7-8d21-7f7d58db22db', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('7a576f20-add3-46f7-8d21-7f7d58db22db', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('7a576f20-add3-46f7-8d21-7f7d58db22db', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('7a576f20-add3-46f7-8d21-7f7d58db22db', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('7a576f20-add3-46f7-8d21-7f7d58db22db', 5, 'Testing', 'Test controls', 'testing', 30),
  ('7a576f20-add3-46f7-8d21-7f7d58db22db', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('7a576f20-add3-46f7-8d21-7f7d58db22db', 7, 'Certification', 'Final certification', 'certification', 14);

-- NIST CSF (8ee80879-e54a-4bc3-9687-bb3e4710893a)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('8ee80879-e54a-4bc3-9687-bb3e4710893a', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('8ee80879-e54a-4bc3-9687-bb3e4710893a', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('8ee80879-e54a-4bc3-9687-bb3e4710893a', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('8ee80879-e54a-4bc3-9687-bb3e4710893a', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('8ee80879-e54a-4bc3-9687-bb3e4710893a', 5, 'Testing', 'Test controls', 'testing', 30),
  ('8ee80879-e54a-4bc3-9687-bb3e4710893a', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('8ee80879-e54a-4bc3-9687-bb3e4710893a', 7, 'Certification', 'Final certification', 'certification', 14);

-- CCPA (d103c2ac-0d90-443f-9df6-6fd599f5ab2a)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('d103c2ac-0d90-443f-9df6-6fd599f5ab2a', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('d103c2ac-0d90-443f-9df6-6fd599f5ab2a', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('d103c2ac-0d90-443f-9df6-6fd599f5ab2a', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('d103c2ac-0d90-443f-9df6-6fd599f5ab2a', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('d103c2ac-0d90-443f-9df6-6fd599f5ab2a', 5, 'Testing', 'Test controls', 'testing', 30),
  ('d103c2ac-0d90-443f-9df6-6fd599f5ab2a', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('d103c2ac-0d90-443f-9df6-6fd599f5ab2a', 7, 'Certification', 'Final certification', 'certification', 14);

-- ISO 9001 (d561e3e5-00c7-47f8-909e-a899af96917c)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('d561e3e5-00c7-47f8-909e-a899af96917c', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('d561e3e5-00c7-47f8-909e-a899af96917c', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('d561e3e5-00c7-47f8-909e-a899af96917c', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('d561e3e5-00c7-47f8-909e-a899af96917c', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('d561e3e5-00c7-47f8-909e-a899af96917c', 5, 'Testing', 'Test controls', 'testing', 30),
  ('d561e3e5-00c7-47f8-909e-a899af96917c', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('d561e3e5-00c7-47f8-909e-a899af96917c', 7, 'Certification', 'Final certification', 'certification', 14);

-- Test Clean Framework (00000000-0000-0000-0000-000000000001)
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, 'Assessment', 'Initial compliance assessment', 'assessment', 14),
  ('00000000-0000-0000-0000-000000000001', 2, 'Gap Analysis', 'Identify compliance gaps', 'gap_analysis', 21),
  ('00000000-0000-0000-0000-000000000001', 3, 'Planning', 'Create implementation plan', 'planning', 14),
  ('00000000-0000-0000-0000-000000000001', 4, 'Implementation', 'Implement controls', 'implementation', 90),
  ('00000000-0000-0000-0000-000000000001', 5, 'Testing', 'Test controls', 'testing', 30),
  ('00000000-0000-0000-0000-000000000001', 6, 'Audit Prep', 'Prepare for audit', 'audit_prep', 21),
  ('00000000-0000-0000-0000-000000000001', 7, 'Certification', 'Final certification', 'certification', 14);