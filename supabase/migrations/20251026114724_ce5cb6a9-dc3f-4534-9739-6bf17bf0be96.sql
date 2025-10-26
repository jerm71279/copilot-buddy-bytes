-- Insert milestone templates for HIPAA
WITH hipaa_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 1,
  'Identify ePHI Systems',
  'Inventory all systems that create, receive, maintain, or transmit ePHI',
  ARRAY['Document ePHI data flows', 'Identify all ePHI systems', 'Map data lifecycle'],
  ARRAY['ePHI inventory completed', 'Data flow diagrams created'],
  true
FROM hipaa_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 2,
  'Determine Covered Entity Status',
  'Confirm HIPAA applicability and entity type',
  ARRAY['Review business functions', 'Determine entity classification', 'Document determination'],
  ARRAY['Entity status documented', 'HIPAA applicability confirmed'],
  true
FROM hipaa_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 1,
  'Conduct Risk Analysis',
  'Perform required HIPAA Security Rule risk analysis',
  ARRAY['Identify threats and vulnerabilities', 'Assess likelihood and impact', 'Document findings'],
  ARRAY['Risk analysis completed', 'Risk register created'],
  true
FROM hipaa_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 2,
  'Document Security Measures',
  'Inventory current administrative, physical, and technical safeguards',
  ARRAY['Review current controls', 'Document safeguards', 'Identify gaps'],
  ARRAY['Current safeguards documented', 'Gap analysis completed'],
  true
FROM hipaa_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 1,
  'Develop Privacy Policies',
  'Create HIPAA Privacy Rule policies and procedures',
  ARRAY['Draft privacy policies', 'Create Notice of Privacy Practices', 'Develop breach notification procedures'],
  ARRAY['Privacy policies completed', 'NPP finalized'],
  true
FROM hipaa_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 2,
  'Create Business Associate Agreements',
  'Develop and execute BAAs with all business associates',
  ARRAY['Identify business associates', 'Draft BAA template', 'Execute agreements'],
  ARRAY['All BAAs executed', 'BAA tracking system established'],
  true
FROM hipaa_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 1,
  'Implement Administrative Safeguards',
  'Deploy required administrative security measures',
  ARRAY['Assign security officer', 'Implement workforce training', 'Establish sanction policy'],
  ARRAY['Security officer designated', 'Training program operational'],
  true
FROM hipaa_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 2,
  'Implement Technical Safeguards',
  'Deploy encryption, access controls, and audit logging',
  ARRAY['Enable encryption at rest and in transit', 'Configure access controls', 'Implement audit logging'],
  ARRAY['Technical safeguards operational', 'Configurations documented'],
  true
FROM hipaa_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 3,
  'Implement Physical Safeguards',
  'Establish physical security controls for ePHI',
  ARRAY['Secure facility access', 'Control workstation use', 'Implement device controls'],
  ARRAY['Physical controls operational', 'Access logs maintained'],
  true
FROM hipaa_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 1,
  'Conduct Workforce Training',
  'Train all workforce members on HIPAA requirements',
  ARRAY['Develop training materials', 'Deliver HIPAA training', 'Document attendance'],
  ARRAY['All workforce trained', 'Training records maintained'],
  true
FROM hipaa_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 2,
  'Test Incident Response',
  'Conduct tabletop exercise for breach response',
  ARRAY['Develop incident scenarios', 'Execute tabletop exercise', 'Document lessons learned'],
  ARRAY['Exercise completed', 'Response plan validated'],
  true
FROM hipaa_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 1,
  'Complete Documentation Review',
  'Verify all required HIPAA documentation is complete',
  ARRAY['Review all policies', 'Verify risk analysis documentation', 'Check BAA compliance'],
  ARRAY['Documentation audit passed', 'All gaps remediated'],
  true
FROM hipaa_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 2,
  'Validate Safeguard Implementation',
  'Test effectiveness of all implemented safeguards',
  ARRAY['Test technical controls', 'Review audit logs', 'Verify access controls'],
  ARRAY['All safeguards validated', 'Testing documented'],
  true
FROM hipaa_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 1,
  'Establish Annual Review Process',
  'Set up ongoing compliance monitoring program',
  ARRAY['Schedule annual risk assessments', 'Establish policy review cycle', 'Implement continuous monitoring'],
  ARRAY['Monitoring program established', 'Review schedule created'],
  true
FROM hipaa_stages WHERE stage_number = 7
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'HIPAA'), 2,
  'Document Compliance Posture',
  'Create compliance attestation and supporting documentation',
  ARRAY['Compile compliance evidence', 'Document safeguards', 'Create attestation'],
  ARRAY['Compliance documentation complete', 'Attestation signed'],
  true
FROM hipaa_stages WHERE stage_number = 7;

-- Insert milestone templates for PCI DSS
WITH pci_stages AS (
  SELECT id, stage_number FROM compliance_roadmap_stage_templates 
  WHERE framework_id = (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS')
)
INSERT INTO compliance_roadmap_milestone_templates (stage_template_id, framework_id, sequence_order, milestone_name, milestone_description, required_actions, success_criteria, evidence_required)
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 1,
  'Define Cardholder Data Environment',
  'Identify all locations where cardholder data is stored, processed, or transmitted',
  ARRAY['Map data flows', 'Identify CDE systems', 'Document network boundaries'],
  ARRAY['CDE diagram completed', 'All systems identified'],
  true
FROM pci_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 2,
  'Determine PCI DSS Scope',
  'Define assessment scope and merchant level',
  ARRAY['Calculate transaction volume', 'Determine merchant level', 'Document scope'],
  ARRAY['Scope documented', 'Merchant level confirmed'],
  true
FROM pci_stages WHERE stage_number = 1
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 1,
  'Assess All 12 Requirements',
  'Conduct gap assessment against PCI DSS v4.0 requirements',
  ARRAY['Review network security', 'Assess access controls', 'Evaluate monitoring'],
  ARRAY['All 12 requirements assessed', 'Gap report generated'],
  true
FROM pci_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 2,
  'Identify Compensating Controls',
  'Document any compensating controls for non-compliant requirements',
  ARRAY['Identify technical limitations', 'Design compensating controls', 'Document justifications'],
  ARRAY['Compensating controls documented', 'Approved by QSA if applicable'],
  true
FROM pci_stages WHERE stage_number = 2
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 1,
  'Develop Remediation Plan',
  'Create prioritized plan to address all gaps',
  ARRAY['Prioritize findings', 'Assign remediation owners', 'Set target dates'],
  ARRAY['Remediation plan approved', 'Resources allocated'],
  true
FROM pci_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 2,
  'Design Network Segmentation',
  'Plan network segmentation to reduce PCI scope',
  ARRAY['Design segmentation architecture', 'Plan firewall rules', 'Document segmentation'],
  ARRAY['Segmentation design approved', 'Implementation plan created'],
  true
FROM pci_stages WHERE stage_number = 3
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 1,
  'Implement Network Security',
  'Deploy firewalls, encryption, and network segmentation',
  ARRAY['Configure firewalls', 'Implement encryption', 'Segment networks'],
  ARRAY['Network security operational', 'Configurations documented'],
  true
FROM pci_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 2,
  'Implement Access Controls',
  'Deploy strong authentication and access management',
  ARRAY['Implement MFA', 'Configure role-based access', 'Enable logging'],
  ARRAY['Access controls operational', 'MFA enforced'],
  true
FROM pci_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 3,
  'Deploy Monitoring and Logging',
  'Implement comprehensive security monitoring',
  ARRAY['Configure log collection', 'Deploy SIEM', 'Enable alerting'],
  ARRAY['Monitoring operational', 'Logs centralized'],
  true
FROM pci_stages WHERE stage_number = 4
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 1,
  'Conduct ASV Scans',
  'Perform Approved Scanning Vendor vulnerability scans',
  ARRAY['Engage ASV', 'Schedule quarterly scans', 'Remediate findings'],
  ARRAY['Passing ASV scan achieved', 'Scan reports obtained'],
  true
FROM pci_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 2,
  'Perform Penetration Testing',
  'Conduct internal and external penetration tests',
  ARRAY['Engage penetration testers', 'Test CDE and networks', 'Remediate findings'],
  ARRAY['Penetration test passed', 'Report obtained'],
  true
FROM pci_stages WHERE stage_number = 5
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 1,
  'Complete Self-Assessment',
  'Fill out applicable SAQ or prepare for QSA audit',
  ARRAY['Complete SAQ questionnaire', 'Gather evidence', 'Document compliance'],
  ARRAY['SAQ completed', 'Evidence collected'],
  true
FROM pci_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 2,
  'Prepare AOC Documentation',
  'Prepare Attestation of Compliance package',
  ARRAY['Compile all evidence', 'Review documentation', 'Prepare executive summary'],
  ARRAY['AOC package complete', 'Ready for submission'],
  true
FROM pci_stages WHERE stage_number = 6
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 1,
  'QSA On-Site Assessment',
  'Undergo on-site audit by Qualified Security Assessor',
  ARRAY['Facilitate QSA interviews', 'Provide evidence', 'Demonstrate controls'],
  ARRAY['Assessment completed', 'All requirements validated'],
  true
FROM pci_stages WHERE stage_number = 7
UNION ALL
SELECT id, (SELECT id FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'), 2,
  'Receive AOC and ROC',
  'Obtain final Attestation of Compliance and Report on Compliance',
  ARRAY['Review draft reports', 'Address findings', 'Receive final documents'],
  ARRAY['AOC issued', 'PCI DSS compliant status achieved'],
  true
FROM pci_stages WHERE stage_number = 7;