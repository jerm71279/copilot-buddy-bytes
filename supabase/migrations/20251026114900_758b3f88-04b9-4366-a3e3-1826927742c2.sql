-- Insert milestone templates for remaining frameworks (NIST CSF, CMMC, GDPR, FISMA, CCPA, ISO 9001)

-- NIST CSF Milestones
WITH nist_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'NIST-CSF')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'), 1,
  'Review Framework Core',
  'Study the 5 Functions and 23 Categories of NIST CSF',
  ARRAY['Review Identify function', 'Study Protect function', 'Understand Detect, Respond, Recover'],
  ARRAY['Framework understanding documented', 'Key concepts identified'],
  false
FROM nist_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'), 1,
  'Document Current State',
  'Create Current Profile across all 5 Functions',
  ARRAY['Assess Identify capabilities', 'Document Protect controls', 'Evaluate Detect, Respond, Recover maturity'],
  ARRAY['Current Profile completed', 'Maturity levels documented'],
  true
FROM nist_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'), 1,
  'Define Target Profile',
  'Establish desired cybersecurity outcomes',
  ARRAY['Set target maturity levels', 'Align with business objectives', 'Define implementation tiers'],
  ARRAY['Target Profile approved', 'Gap analysis completed'],
  true
FROM nist_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'), 1,
  'Implement Controls',
  'Deploy controls to achieve Target Profile',
  ARRAY['Implement Identify controls', 'Deploy Protect mechanisms', 'Enable Detect capabilities'],
  ARRAY['All functions implemented', 'Target maturity achieved'],
  true
FROM nist_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'), 1,
  'Measure Progress',
  'Track implementation effectiveness',
  ARRAY['Establish metrics', 'Monitor progress', 'Report to stakeholders'],
  ARRAY['Metrics established', 'Progress tracked'],
  true
FROM nist_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'), 1,
  'Integrate Framework',
  'Embed CSF into enterprise risk management',
  ARRAY['Update risk processes', 'Train personnel', 'Align with business'],
  ARRAY['Framework integrated', 'Ongoing use established'],
  true
FROM nist_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'), 1,
  'Continuous Assessment',
  'Establish ongoing maturity assessment',
  ARRAY['Schedule regular assessments', 'Update profiles', 'Adapt to changes'],
  ARRAY['Assessment cycle established', 'Continuous improvement active'],
  true
FROM nist_stages WHERE stage_number = 7;

-- CMMC Level 2 Milestones
WITH cmmc_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_L2')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'), 1,
  'Define CUI Scope',
  'Identify all Controlled Unclassified Information',
  ARRAY['Review contracts for CUI requirements', 'Identify CUI data flows', 'Document CUI locations'],
  ARRAY['CUI inventory completed', 'Scope boundaries defined'],
  true
FROM cmmc_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'), 1,
  'Assess 110 Practices',
  'Evaluate compliance with all Level 2 practices',
  ARRAY['Review all 17 domains', 'Assess practice implementation', 'Identify gaps'],
  ARRAY['All practices assessed', 'Gap report generated'],
  true
FROM cmmc_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'), 1,
  'Develop System Security Plan',
  'Create CMMC-compliant SSP',
  ARRAY['Document system architecture', 'Describe security controls', 'Create implementation plans'],
  ARRAY['SSP completed', 'Management approved'],
  true
FROM cmmc_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'), 1,
  'Implement Level 2 Practices',
  'Deploy all required practices across 17 domains',
  ARRAY['Implement access control', 'Deploy audit and accountability', 'Configure all domains'],
  ARRAY['All practices operational', 'Configurations documented'],
  true
FROM cmmc_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'), 1,
  'Conduct Internal Assessment',
  'Perform self-assessment of all practices',
  ARRAY['Test practice effectiveness', 'Collect evidence', 'Document findings'],
  ARRAY['Assessment completed', 'Evidence collected'],
  true
FROM cmmc_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'), 1,
  'Prepare for C3PAO',
  'Ready all documentation for external assessment',
  ARRAY['Compile evidence repository', 'Review all practices', 'Prepare interview guides'],
  ARRAY['Documentation complete', 'Ready for C3PAO'],
  true
FROM cmmc_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'), 1,
  'Undergo C3PAO Assessment',
  'Complete CMMC certification assessment',
  ARRAY['Facilitate assessor interviews', 'Provide evidence', 'Demonstrate practices'],
  ARRAY['Assessment passed', 'CMMC Level 2 certificate issued'],
  true
FROM cmmc_stages WHERE stage_number = 7;

-- GDPR Milestones
WITH gdpr_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'GDPR')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'GDPR'), 1,
  'Create Data Inventory',
  'Document all personal data processing',
  ARRAY['List all personal data', 'Map data flows', 'Identify data sources'],
  ARRAY['Data inventory completed', 'Processing activities documented'],
  true
FROM gdpr_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'GDPR'), 1,
  'Assess GDPR Compliance',
  'Review compliance with all GDPR Articles',
  ARRAY['Review lawful basis', 'Assess data subject rights', 'Evaluate security measures'],
  ARRAY['Compliance assessment completed', 'Gap analysis documented'],
  true
FROM gdpr_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'GDPR'), 1,
  'Update Privacy Policies',
  'Create GDPR-compliant privacy framework',
  ARRAY['Draft privacy policy', 'Create consent mechanisms', 'Appoint DPO if required'],
  ARRAY['Privacy policies published', 'Consent systems operational'],
  true
FROM gdpr_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'GDPR'), 1,
  'Implement Data Protection',
  'Deploy privacy by design and technical measures',
  ARRAY['Implement encryption', 'Configure access controls', 'Build DSAR processes'],
  ARRAY['Technical measures deployed', 'DSAR system operational'],
  true
FROM gdpr_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'GDPR'), 1,
  'Conduct DPIA',
  'Perform Data Protection Impact Assessments',
  ARRAY['Identify high-risk processing', 'Conduct DPIA', 'Implement mitigations'],
  ARRAY['DPIAs completed', 'Risks mitigated'],
  true
FROM gdpr_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'GDPR'), 1,
  'Complete RoPA',
  'Finalize Records of Processing Activities',
  ARRAY['Document all processing', 'Create RoPA register', 'Update regularly'],
  ARRAY['RoPA completed', 'Register maintained'],
  true
FROM gdpr_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'GDPR'), 1,
  'Establish Ongoing Compliance',
  'Implement continuous GDPR monitoring',
  ARRAY['Schedule regular reviews', 'Monitor data breaches', 'Maintain documentation'],
  ARRAY['Monitoring program active', 'Compliance sustained'],
  true
FROM gdpr_stages WHERE stage_number = 7;

-- FISMA Milestones
WITH fisma_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'FISMA')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'FISMA'), 1,
  'Categorize System',
  'Determine system impact level per FIPS 199',
  ARRAY['Assess confidentiality impact', 'Assess integrity impact', 'Assess availability impact'],
  ARRAY['System categorization approved', 'Impact level documented'],
  true
FROM fisma_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'FISMA'), 1,
  'Select Controls',
  'Choose security controls from NIST SP 800-53',
  ARRAY['Select baseline controls', 'Tailor for system', 'Document selections'],
  ARRAY['Control baseline selected', 'Tailoring documented'],
  true
FROM fisma_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'FISMA'), 1,
  'Develop System Security Plan',
  'Create comprehensive SSP',
  ARRAY['Document system description', 'Describe control implementation', 'Create security architecture'],
  ARRAY['SSP completed', 'Authorizing official approved'],
  true
FROM fisma_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'FISMA'), 1,
  'Implement Controls',
  'Deploy all selected security controls',
  ARRAY['Implement technical controls', 'Establish procedures', 'Train personnel'],
  ARRAY['All controls implemented', 'Documentation updated'],
  true
FROM fisma_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'FISMA'), 1,
  'Conduct Security Assessment',
  'Perform independent control assessment',
  ARRAY['Engage independent assessor', 'Test control effectiveness', 'Document findings'],
  ARRAY['Assessment completed', 'SAR delivered'],
  true
FROM fisma_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'FISMA'), 1,
  'Develop POA&M',
  'Create Plan of Action and Milestones',
  ARRAY['Document all weaknesses', 'Create remediation plans', 'Set target dates'],
  ARRAY['POA&M approved', 'ATO package ready'],
  true
FROM fisma_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'FISMA'), 1,
  'Obtain ATO',
  'Receive Authority to Operate',
  ARRAY['Submit ATO package', 'Brief authorizing official', 'Obtain authorization'],
  ARRAY['ATO granted', 'Authorization letter received'],
  true
FROM fisma_stages WHERE stage_number = 7;

-- CCPA Milestones
WITH ccpa_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'CCPA')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CCPA'), 1,
  'Determine Applicability',
  'Confirm CCPA requirements apply to business',
  ARRAY['Calculate revenue threshold', 'Count California consumers', 'Assess data processing'],
  ARRAY['Applicability determined', 'Requirements documented'],
  true
FROM ccpa_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CCPA'), 1,
  'Review Data Practices',
  'Audit all consumer data collection and sharing',
  ARRAY['Inventory data categories', 'Document data sources', 'Identify third-party sharing'],
  ARRAY['Data practices documented', 'Sharing mapped'],
  true
FROM ccpa_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CCPA'), 1,
  'Update Privacy Policy',
  'Add CCPA-required disclosures',
  ARRAY['Disclose data categories', 'Explain consumer rights', 'Add opt-out links'],
  ARRAY['Privacy policy updated', 'Disclosures complete'],
  true
FROM ccpa_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CCPA'), 1,
  'Implement Consumer Rights',
  'Build systems for right to know, delete, opt-out',
  ARRAY['Create request forms', 'Build verification process', 'Implement opt-out mechanism'],
  ARRAY['All rights mechanisms operational', 'Request handling tested'],
  true
FROM ccpa_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CCPA'), 1,
  'Establish Request Handling',
  'Create verified consumer request procedures',
  ARRAY['Develop verification methods', 'Set response timelines', 'Train staff'],
  ARRAY['Request process operational', 'Staff trained'],
  true
FROM ccpa_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CCPA'), 1,
  'Update Vendor Contracts',
  'Ensure service provider agreements comply',
  ARRAY['Review all vendor contracts', 'Add required clauses', 'Execute amendments'],
  ARRAY['All contracts updated', 'Service provider agreements compliant'],
  true
FROM ccpa_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'CCPA'), 1,
  'Establish Monitoring',
  'Implement ongoing compliance program',
  ARRAY['Schedule annual reviews', 'Monitor request volumes', 'Update procedures'],
  ARRAY['Monitoring program active', 'Annual review scheduled'],
  true
FROM ccpa_stages WHERE stage_number = 7;

-- ISO 9001 Milestones
WITH iso9001_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO-9001')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO-9001'), 1,
  'Define QMS Scope',
  'Establish Quality Management System boundaries',
  ARRAY['Identify applicable processes', 'Define organizational context', 'Document scope exclusions'],
  ARRAY['Scope statement approved', 'Context documented'],
  true
FROM iso9001_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO-9001'), 1,
  'Map Processes',
  'Document all organizational processes',
  ARRAY['Create process map', 'Identify process interactions', 'Define process owners'],
  ARRAY['Process map completed', 'Interactions documented'],
  true
FROM iso9001_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO-9001'), 1,
  'Develop QMS Documentation',
  'Create quality manual and procedures',
  ARRAY['Draft quality manual', 'Write procedures', 'Create work instructions'],
  ARRAY['Documentation suite completed', 'Management approved'],
  true
FROM iso9001_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO-9001'), 1,
  'Implement QMS',
  'Deploy quality processes and controls',
  ARRAY['Train personnel', 'Implement procedures', 'Establish monitoring'],
  ARRAY['QMS operational', 'Training completed'],
  true
FROM iso9001_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO-9001'), 1,
  'Conduct Internal Audit',
  'Perform internal quality audit',
  ARRAY['Plan audit scope', 'Execute audit', 'Document findings'],
  ARRAY['Audit completed', 'Non-conformities identified'],
  true
FROM iso9001_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO-9001'), 1,
  'Implement Corrective Actions',
  'Address all non-conformities',
  ARRAY['Develop action plans', 'Implement corrections', 'Verify effectiveness'],
  ARRAY['All non-conformities closed', 'Effectiveness verified'],
  true
FROM iso9001_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'ISO-9001'), 1,
  'Achieve ISO 9001 Certification',
  'Complete certification audit',
  ARRAY['Undergo Stage 1 audit', 'Complete Stage 2 audit', 'Receive certificate'],
  ARRAY['Certification achieved', 'Certificate issued'],
  true
FROM iso9001_stages WHERE stage_number = 7;