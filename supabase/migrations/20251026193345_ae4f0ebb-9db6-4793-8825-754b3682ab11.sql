
-- Deactivate CMMC framework (user wants to remove it)
UPDATE compliance_frameworks
SET is_active = false
WHERE framework_code = 'CMMC';

-- Create stage templates for CMMC_NIST_800_171
INSERT INTO compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
VALUES
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171'), 1, 'NIST 800-171 Scoping', 'Define CUI scope and NIST 800-171 assessment boundaries', 'assessment', 14),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171'), 2, 'Control Gap Analysis', 'Assess current state against 110 NIST 800-171 controls', 'gap_analysis', 30),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171'), 3, 'System Security Plan', 'Develop NIST 800-171 compliant SSP and documentation', 'planning', 30),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171'), 4, 'Control Implementation', 'Implement all 110 controls across 14 families', 'implementation', 120),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171'), 5, 'Assessment Preparation', 'Conduct internal assessment and evidence collection', 'testing', 30),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171'), 6, 'Pre-Assessment Validation', 'Validate all controls and prepare for assessment', 'audit_prep', 21),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171'), 7, 'NIST 800-171 Certification', 'Undergo assessment and receive certification', 'certification', 45);

-- Create stage templates for SOC-2
INSERT INTO compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
VALUES
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2'), 1, 'SOC 2 Scoping', 'Define trust service criteria and audit scope', 'assessment', 14),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2'), 2, 'Control Gap Analysis', 'Assess current controls against SOC 2 criteria', 'gap_analysis', 30),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2'), 3, 'Control Design', 'Design and document SOC 2 controls', 'planning', 30),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2'), 4, 'Control Implementation', 'Implement controls across trust service criteria', 'implementation', 120),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2'), 5, 'Readiness Assessment', 'Conduct internal readiness assessment', 'testing', 30),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2'), 6, 'Audit Preparation', 'Prepare evidence and documentation for auditor', 'audit_prep', 21),
  ((SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2'), 7, 'SOC 2 Audit', 'Complete Type I or Type II audit', 'certification', 45);

-- Create milestone templates for CMMC_NIST_800_171
WITH stage_ids AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171')
)
INSERT INTO compliance_roadmap_milestone_templates 
  (framework_id, stage_template_id, milestone_name, milestone_description, sequence_order, required_actions, success_criteria, evidence_required)
SELECT 
  (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_NIST_800_171'),
  stage_ids.id,
  CASE stage_ids.stage_number
    WHEN 1 THEN 'Define CUI Scope'
    WHEN 2 THEN 'Assess 110 Controls'
    WHEN 3 THEN 'Develop System Security Plan'
    WHEN 4 THEN 'Implement NIST Controls'
    WHEN 5 THEN 'Conduct Internal Assessment'
    WHEN 6 THEN 'Prepare for Assessment'
    WHEN 7 THEN 'Undergo Certification Assessment'
  END,
  CASE stage_ids.stage_number
    WHEN 1 THEN 'Identify all Controlled Unclassified Information'
    WHEN 2 THEN 'Evaluate compliance with all NIST 800-171 controls'
    WHEN 3 THEN 'Create NIST 800-171 compliant SSP'
    WHEN 4 THEN 'Deploy all required controls across 14 families'
    WHEN 5 THEN 'Perform self-assessment of all controls'
    WHEN 6 THEN 'Ready all documentation for external assessment'
    WHEN 7 THEN 'Complete NIST 800-171 certification assessment'
  END,
  1,
  CASE stage_ids.stage_number
    WHEN 1 THEN ARRAY['Review contracts for CUI requirements', 'Identify CUI data flows', 'Document CUI locations']
    WHEN 2 THEN ARRAY['Review all 14 families', 'Assess control implementation', 'Identify gaps']
    WHEN 3 THEN ARRAY['Document system architecture', 'Describe security controls', 'Create implementation plans']
    WHEN 4 THEN ARRAY['Implement access control', 'Deploy audit and accountability', 'Configure all families']
    WHEN 5 THEN ARRAY['Test control effectiveness', 'Collect evidence', 'Document findings']
    WHEN 6 THEN ARRAY['Compile evidence repository', 'Review all controls', 'Prepare interview guides']
    WHEN 7 THEN ARRAY['Facilitate assessor interviews', 'Provide evidence', 'Demonstrate controls']
  END,
  CASE stage_ids.stage_number
    WHEN 1 THEN ARRAY['CUI inventory completed', 'Scope boundaries defined']
    WHEN 2 THEN ARRAY['All controls assessed', 'Gap report generated']
    WHEN 3 THEN ARRAY['SSP completed', 'Management approved']
    WHEN 4 THEN ARRAY['All controls operational', 'Configurations documented']
    WHEN 5 THEN ARRAY['Assessment completed', 'Evidence collected']
    WHEN 6 THEN ARRAY['Documentation complete', 'Ready for assessment']
    WHEN 7 THEN ARRAY['Assessment passed', 'NIST 800-171 certificate issued']
  END,
  true
FROM stage_ids;

-- Create milestone templates for SOC-2
WITH stage_ids AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2')
)
INSERT INTO compliance_roadmap_milestone_templates 
  (framework_id, stage_template_id, milestone_name, milestone_description, sequence_order, required_actions, success_criteria, evidence_required)
SELECT 
  (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC-2'),
  stage_ids.id,
  CASE stage_ids.stage_number
    WHEN 1 THEN 'Define Trust Service Criteria'
    WHEN 2 THEN 'Assess Current Controls'
    WHEN 3 THEN 'Document Control Design'
    WHEN 4 THEN 'Implement SOC 2 Controls'
    WHEN 5 THEN 'Conduct Readiness Assessment'
    WHEN 6 THEN 'Prepare Audit Evidence'
    WHEN 7 THEN 'Complete SOC 2 Audit'
  END,
  CASE stage_ids.stage_number
    WHEN 1 THEN 'Identify applicable trust service criteria and scope'
    WHEN 2 THEN 'Evaluate current controls against SOC 2 requirements'
    WHEN 3 THEN 'Design and document SOC 2 control framework'
    WHEN 4 THEN 'Deploy controls across security, availability, processing integrity, confidentiality, and privacy'
    WHEN 5 THEN 'Perform internal readiness assessment'
    WHEN 6 THEN 'Compile and organize evidence for auditor review'
    WHEN 7 THEN 'Complete SOC 2 Type I or Type II audit'
  END,
  1,
  CASE stage_ids.stage_number
    WHEN 1 THEN ARRAY['Select TSC categories', 'Define system boundaries', 'Identify key controls']
    WHEN 2 THEN ARRAY['Review existing controls', 'Identify control gaps', 'Assess control maturity']
    WHEN 3 THEN ARRAY['Document control objectives', 'Design control activities', 'Create control matrix']
    WHEN 4 THEN ARRAY['Implement security controls', 'Configure monitoring', 'Establish evidence collection']
    WHEN 5 THEN ARRAY['Test control effectiveness', 'Review evidence', 'Document deficiencies']
    WHEN 6 THEN ARRAY['Organize audit evidence', 'Prepare control narratives', 'Coordinate with auditor']
    WHEN 7 THEN ARRAY['Support audit fieldwork', 'Respond to auditor requests', 'Receive audit report']
  END,
  CASE stage_ids.stage_number
    WHEN 1 THEN ARRAY['TSC scope defined', 'Management approved']
    WHEN 2 THEN ARRAY['Gap analysis completed', 'Remediation plan created']
    WHEN 3 THEN ARRAY['Controls documented', 'Control matrix finalized']
    WHEN 4 THEN ARRAY['All controls operational', 'Evidence collection automated']
    WHEN 5 THEN ARRAY['Readiness assessment passed', 'Deficiencies remediated']
    WHEN 6 THEN ARRAY['Evidence package complete', 'Audit kickoff scheduled']
    WHEN 7 THEN ARRAY['Audit completed', 'SOC 2 report issued']
  END,
  true
FROM stage_ids;
