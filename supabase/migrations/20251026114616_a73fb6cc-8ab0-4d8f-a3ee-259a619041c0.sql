-- Insert milestone templates for SOC 2
WITH soc2_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
-- Stage 1 milestones
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 1, 
  'Define Trust Service Criteria', 
  'Select applicable TSC (Security, Availability, Confidentiality, Processing Integrity, Privacy)',
  ARRAY['Review business operations', 'Identify applicable criteria', 'Document scope decisions'],
  ARRAY['TSC selection documented', 'Scope document approved'],
  true
FROM soc2_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 2,
  'Establish Project Team',
  'Assign roles and responsibilities for SOC 2 implementation',
  ARRAY['Identify project stakeholders', 'Assign control owners', 'Set project timeline'],
  ARRAY['RACI matrix completed', 'Project plan approved'],
  true
FROM soc2_stages WHERE stage_number = 1
UNION ALL
-- Stage 2 milestones
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 1,
  'Document Current Controls',
  'Inventory existing security controls and policies',
  ARRAY['Review current policies', 'Interview control owners', 'Document technical controls'],
  ARRAY['Control inventory completed', 'Current state documented'],
  true
FROM soc2_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 2,
  'Identify Control Gaps',
  'Compare current state to SOC 2 requirements',
  ARRAY['Map controls to TSC', 'Identify missing controls', 'Prioritize remediation'],
  ARRAY['Gap analysis report completed', 'Remediation priorities set'],
  true
FROM soc2_stages WHERE stage_number = 2
UNION ALL
-- Stage 3 milestones
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 1,
  'Design Control Framework',
  'Design comprehensive SOC 2 control framework',
  ARRAY['Document control objectives', 'Define control activities', 'Create control matrix'],
  ARRAY['Control descriptions documented', 'Control matrix approved'],
  true
FROM soc2_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 2,
  'Develop Policies and Procedures',
  'Create or update security policies to support controls',
  ARRAY['Draft security policies', 'Document procedures', 'Obtain management approval'],
  ARRAY['Policy suite completed', 'Procedures documented'],
  true
FROM soc2_stages WHERE stage_number = 3
UNION ALL
-- Stage 4 milestones
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 1,
  'Implement Technical Controls',
  'Deploy security controls and monitoring systems',
  ARRAY['Configure security tools', 'Implement access controls', 'Enable logging and monitoring'],
  ARRAY['Controls operational', 'Monitoring active'],
  true
FROM soc2_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 2,
  'Conduct Security Training',
  'Train workforce on security policies and procedures',
  ARRAY['Develop training materials', 'Deliver security awareness', 'Track completion'],
  ARRAY['Training completed', 'Attendance documented'],
  true
FROM soc2_stages WHERE stage_number = 4
UNION ALL
-- Stage 5 milestones
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 1,
  'Establish Evidence Collection Process',
  'Set up systematic evidence collection procedures',
  ARRAY['Define evidence requirements', 'Create collection procedures', 'Assign evidence owners'],
  ARRAY['Evidence matrix created', 'Collection process documented'],
  true
FROM soc2_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 2,
  'Collect Control Evidence',
  'Gather evidence over required observation period (3-12 months)',
  ARRAY['Collect audit logs', 'Document control execution', 'Archive evidence'],
  ARRAY['Evidence collected', 'Evidence repository maintained'],
  true
FROM soc2_stages WHERE stage_number = 5
UNION ALL
-- Stage 6 milestones
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 1,
  'Conduct Readiness Assessment',
  'Perform internal audit to validate readiness',
  ARRAY['Test control effectiveness', 'Review evidence completeness', 'Identify deficiencies'],
  ARRAY['Readiness assessment completed', 'Deficiencies remediated'],
  true
FROM soc2_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 2,
  'Select Audit Firm',
  'Engage qualified CPA firm to perform SOC 2 audit',
  ARRAY['Request proposals', 'Evaluate auditors', 'Execute engagement letter'],
  ARRAY['Auditor selected', 'Engagement letter signed'],
  true
FROM soc2_stages WHERE stage_number = 6
UNION ALL
-- Stage 7 milestones
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 1,
  'Facilitate Audit Fieldwork',
  'Support auditor during examination process',
  ARRAY['Provide evidence to auditors', 'Respond to inquiries', 'Facilitate interviews'],
  ARRAY['Evidence provided', 'Audit fieldwork completed'],
  true
FROM soc2_stages WHERE stage_number = 7
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'SOC2'), 2,
  'Receive SOC 2 Report',
  'Obtain final SOC 2 Type II report',
  ARRAY['Review draft report', 'Address findings', 'Receive final report'],
  ARRAY['SOC 2 Type II report issued', 'Clean opinion achieved'],
  true
FROM soc2_stages WHERE stage_number = 7;

-- Insert milestone templates for ISO 27001
WITH iso_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 1,
  'Define ISMS Scope',
  'Establish boundaries and applicability of ISMS',
  ARRAY['Identify business units', 'Define organizational boundaries', 'Document exclusions'],
  ARRAY['Scope statement approved', 'Boundaries documented'],
  true
FROM iso_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 2,
  'Identify Stakeholders',
  'Determine internal and external interested parties',
  ARRAY['List stakeholders', 'Document requirements', 'Identify legal obligations'],
  ARRAY['Stakeholder register created', 'Requirements documented'],
  true
FROM iso_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 1,
  'Asset Identification',
  'Create inventory of information assets',
  ARRAY['Identify information assets', 'Document asset owners', 'Classify assets'],
  ARRAY['Asset register completed', 'Classification scheme applied'],
  true
FROM iso_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 2,
  'Conduct Risk Assessment',
  'Perform information security risk assessment',
  ARRAY['Identify threats and vulnerabilities', 'Assess likelihood and impact', 'Calculate risk levels'],
  ARRAY['Risk assessment completed', 'Risk register populated'],
  true
FROM iso_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 1,
  'Develop Risk Treatment Plan',
  'Define approach for treating identified risks',
  ARRAY['Select risk treatment options', 'Identify required controls', 'Assign control owners'],
  ARRAY['Risk treatment plan approved', 'Control selection justified'],
  true
FROM iso_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 2,
  'Create Statement of Applicability',
  'Document applicable Annex A controls and justifications',
  ARRAY['Review all Annex A controls', 'Document applicability decisions', 'Provide justifications'],
  ARRAY['SoA completed', 'Management approved'],
  true
FROM iso_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 1,
  'Implement Technical Controls',
  'Deploy technical security controls from Annex A',
  ARRAY['Configure access controls', 'Implement encryption', 'Deploy monitoring'],
  ARRAY['Controls operational', 'Configuration documented'],
  true
FROM iso_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 2,
  'Establish Operational Procedures',
  'Document and implement operational security procedures',
  ARRAY['Create procedures', 'Train personnel', 'Integrate into operations'],
  ARRAY['Procedures documented', 'Training completed'],
  true
FROM iso_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 1,
  'Conduct Internal Audit',
  'Perform comprehensive ISMS internal audit',
  ARRAY['Plan audit scope', 'Execute audit', 'Document findings'],
  ARRAY['Audit completed', 'Non-conformities identified'],
  true
FROM iso_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 2,
  'Management Review',
  'Conduct ISMS management review meeting',
  ARRAY['Prepare management review inputs', 'Present to leadership', 'Document decisions'],
  ARRAY['Review completed', 'Improvement actions identified'],
  true
FROM iso_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 1,
  'Remediate Non-Conformities',
  'Address all findings from internal audit',
  ARRAY['Develop corrective action plans', 'Implement corrections', 'Verify effectiveness'],
  ARRAY['All non-conformities closed', 'Evidence documented'],
  true
FROM iso_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 2,
  'Prepare Documentation',
  'Organize all ISMS documentation for certification',
  ARRAY['Compile ISMS documentation', 'Verify completeness', 'Prepare evidence folders'],
  ARRAY['Documentation package complete', 'Ready for Stage 1 audit'],
  true
FROM iso_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 1,
  'Stage 1 Audit',
  'Undergo documentation review by certification body',
  ARRAY['Provide documentation to auditors', 'Respond to queries', 'Address Stage 1 findings'],
  ARRAY['Stage 1 passed', 'Ready for Stage 2'],
  true
FROM iso_stages WHERE stage_number = 7
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO27001'), 2,
  'Stage 2 Audit and Certification',
  'Complete on-site audit and receive ISO 27001 certificate',
  ARRAY['Facilitate on-site audit', 'Demonstrate control effectiveness', 'Receive certificate'],
  ARRAY['Stage 2 passed', 'ISO 27001 certificate issued'],
  true
FROM iso_stages WHERE stage_number = 7;