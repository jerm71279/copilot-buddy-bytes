-- Create template tables for framework-specific roadmap data
CREATE TABLE IF NOT EXISTS public.compliance_roadmap_stage_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.compliance_frameworks(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  stage_description TEXT,
  stage_type TEXT NOT NULL,
  estimated_duration_days INTEGER NOT NULL DEFAULT 14,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(framework_id, stage_number)
);

CREATE TABLE IF NOT EXISTS public.compliance_roadmap_milestone_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_template_id UUID NOT NULL REFERENCES public.compliance_roadmap_stage_templates(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES public.compliance_frameworks(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  required_actions TEXT[],
  success_criteria TEXT[],
  evidence_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_stage_templates_framework ON public.compliance_roadmap_stage_templates(framework_id);
CREATE INDEX idx_milestone_templates_stage ON public.compliance_roadmap_milestone_templates(stage_template_id);

-- Enable RLS
ALTER TABLE public.compliance_roadmap_stage_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_roadmap_milestone_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (templates are readable by all authenticated users)
CREATE POLICY "Templates readable by authenticated users"
  ON public.compliance_roadmap_stage_templates
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Templates readable by authenticated users"
  ON public.compliance_roadmap_milestone_templates
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert SOC 2 Type II roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'Readiness Assessment', 'Evaluate organizational readiness and define SOC 2 scope (Trust Service Criteria selection)', 'assessment', 14 FROM compliance_frameworks WHERE framework_code = 'SOC2'
UNION ALL
SELECT id, 2, 'Gap Analysis', 'Identify gaps between current controls and SOC 2 requirements', 'gap_analysis', 21 FROM compliance_frameworks WHERE framework_code = 'SOC2'
UNION ALL
SELECT id, 3, 'Control Design', 'Design and document SOC 2 controls and policies', 'planning', 30 FROM compliance_frameworks WHERE framework_code = 'SOC2'
UNION ALL
SELECT id, 4, 'Control Implementation', 'Implement security controls and operational procedures', 'implementation', 90 FROM compliance_frameworks WHERE framework_code = 'SOC2'
UNION ALL
SELECT id, 5, 'Evidence Collection', 'Collect evidence of control effectiveness over observation period', 'testing', 180 FROM compliance_frameworks WHERE framework_code = 'SOC2'
UNION ALL
SELECT id, 6, 'Pre-Audit Readiness', 'Complete internal audit and prepare for external examination', 'audit_prep', 30 FROM compliance_frameworks WHERE framework_code = 'SOC2'
UNION ALL
SELECT id, 7, 'SOC 2 Audit', 'Undergo external audit and receive SOC 2 Type II report', 'certification', 45 FROM compliance_frameworks WHERE framework_code = 'SOC2';

-- Insert ISO 27001 roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'Context Establishment', 'Define ISMS scope, boundaries, and organizational context', 'assessment', 21 FROM compliance_frameworks WHERE framework_code = 'ISO27001'
UNION ALL
SELECT id, 2, 'Risk Assessment', 'Conduct comprehensive information security risk assessment', 'gap_analysis', 30 FROM compliance_frameworks WHERE framework_code = 'ISO27001'
UNION ALL
SELECT id, 3, 'Risk Treatment Planning', 'Develop risk treatment plan and Statement of Applicability', 'planning', 21 FROM compliance_frameworks WHERE framework_code = 'ISO27001'
UNION ALL
SELECT id, 4, 'ISMS Implementation', 'Implement ISO 27001 controls (Annex A) and ISMS processes', 'implementation', 120 FROM compliance_frameworks WHERE framework_code = 'ISO27001'
UNION ALL
SELECT id, 5, 'Internal Audit', 'Conduct internal ISMS audit and management review', 'testing', 30 FROM compliance_frameworks WHERE framework_code = 'ISO27001'
UNION ALL
SELECT id, 6, 'Certification Preparation', 'Prepare documentation and evidence for Stage 1 audit', 'audit_prep', 21 FROM compliance_frameworks WHERE framework_code = 'ISO27001'
UNION ALL
SELECT id, 7, 'ISO 27001 Certification', 'Complete Stage 1 and Stage 2 audits, achieve certification', 'certification', 45 FROM compliance_frameworks WHERE framework_code = 'ISO27001';

-- Insert HIPAA roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'HIPAA Scoping', 'Identify ePHI systems, processes, and HIPAA applicability', 'assessment', 14 FROM compliance_frameworks WHERE framework_code = 'HIPAA'
UNION ALL
SELECT id, 2, 'Risk Analysis', 'Conduct HIPAA Security Rule risk analysis (required)', 'gap_analysis', 30 FROM compliance_frameworks WHERE framework_code = 'HIPAA'
UNION ALL
SELECT id, 3, 'Security Policy Development', 'Develop HIPAA policies, procedures, and BAAs', 'planning', 30 FROM compliance_frameworks WHERE framework_code = 'HIPAA'
UNION ALL
SELECT id, 4, 'Safeguard Implementation', 'Implement Administrative, Physical, and Technical safeguards', 'implementation', 90 FROM compliance_frameworks WHERE framework_code = 'HIPAA'
UNION ALL
SELECT id, 5, 'Training and Testing', 'Conduct workforce training and test incident response', 'testing', 30 FROM compliance_frameworks WHERE framework_code = 'HIPAA'
UNION ALL
SELECT id, 6, 'Compliance Validation', 'Complete documentation and validate all safeguards', 'audit_prep', 21 FROM compliance_frameworks WHERE framework_code = 'HIPAA'
UNION ALL
SELECT id, 7, 'Ongoing Compliance', 'Establish continuous monitoring and annual risk assessments', 'certification', 14 FROM compliance_frameworks WHERE framework_code = 'HIPAA';

-- Insert PCI DSS v4.0 roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'Cardholder Data Discovery', 'Identify and map all cardholder data environments (CDE)', 'assessment', 14 FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'
UNION ALL
SELECT id, 2, 'PCI DSS Gap Assessment', 'Assess compliance against all 12 PCI DSS requirements', 'gap_analysis', 30 FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'
UNION ALL
SELECT id, 3, 'Remediation Planning', 'Develop prioritized remediation plan for non-compliant areas', 'planning', 21 FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'
UNION ALL
SELECT id, 4, 'Security Controls Implementation', 'Implement network segmentation, encryption, access controls', 'implementation', 90 FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'
UNION ALL
SELECT id, 5, 'Vulnerability Management', 'Deploy ASV scanning, penetration testing, and patch management', 'testing', 45 FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'
UNION ALL
SELECT id, 6, 'Pre-Assessment Validation', 'Complete internal validation and prepare evidence', 'audit_prep', 30 FROM compliance_frameworks WHERE framework_code = 'PCI-DSS'
UNION ALL
SELECT id, 7, 'QSA Assessment', 'Undergo Qualified Security Assessor audit and receive AOC', 'certification', 30 FROM compliance_frameworks WHERE framework_code = 'PCI-DSS';

-- Insert NIST CSF roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'Framework Familiarization', 'Understand NIST CSF structure and select target profile', 'assessment', 14 FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'
UNION ALL
SELECT id, 2, 'Current Profile Assessment', 'Document current cybersecurity posture across 5 Functions', 'gap_analysis', 21 FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'
UNION ALL
SELECT id, 3, 'Target Profile Definition', 'Define desired cybersecurity outcomes and risk tolerance', 'planning', 14 FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'
UNION ALL
SELECT id, 4, 'Implementation Plan', 'Prioritize and implement controls across Identify, Protect, Detect, Respond, Recover', 'implementation', 120 FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'
UNION ALL
SELECT id, 5, 'Progress Monitoring', 'Measure implementation progress and effectiveness', 'testing', 30 FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'
UNION ALL
SELECT id, 6, 'Framework Integration', 'Integrate CSF into risk management and business processes', 'audit_prep', 30 FROM compliance_frameworks WHERE framework_code = 'NIST-CSF'
UNION ALL
SELECT id, 7, 'Continuous Improvement', 'Establish ongoing maturity assessment and adaptation', 'certification', 30 FROM compliance_frameworks WHERE framework_code = 'NIST-CSF';

-- Insert CMMC Level 2 roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'CMMC Scoping', 'Define CUI scope and CMMC assessment boundaries', 'assessment', 14 FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'
UNION ALL
SELECT id, 2, 'Practice Gap Analysis', 'Assess current state against 110 CMMC Level 2 practices', 'gap_analysis', 30 FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'
UNION ALL
SELECT id, 3, 'System Security Plan', 'Develop CMMC-compliant SSP and documentation', 'planning', 30 FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'
UNION ALL
SELECT id, 4, 'Practice Implementation', 'Implement all Level 2 practices across 17 domains', 'implementation', 120 FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'
UNION ALL
SELECT id, 5, 'Assessment Preparation', 'Conduct internal assessment and evidence collection', 'testing', 30 FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'
UNION ALL
SELECT id, 6, 'Pre-Assessment Validation', 'Validate all practices and prepare for C3PAO assessment', 'audit_prep', 21 FROM compliance_frameworks WHERE framework_code = 'CMMC_L2'
UNION ALL
SELECT id, 7, 'CMMC Certification', 'Undergo C3PAO assessment and receive CMMC certificate', 'certification', 45 FROM compliance_frameworks WHERE framework_code = 'CMMC_L2';

-- Insert GDPR roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'Data Mapping', 'Map all personal data processing activities and data flows', 'assessment', 21 FROM compliance_frameworks WHERE framework_code = 'GDPR'
UNION ALL
SELECT id, 2, 'Compliance Gap Analysis', 'Assess compliance with GDPR Articles and identify gaps', 'gap_analysis', 21 FROM compliance_frameworks WHERE framework_code = 'GDPR'
UNION ALL
SELECT id, 3, 'Privacy Framework Design', 'Develop privacy policies, consent mechanisms, and DPO appointment', 'planning', 30 FROM compliance_frameworks WHERE framework_code = 'GDPR'
UNION ALL
SELECT id, 4, 'Technical Implementation', 'Implement privacy by design, data protection measures, and DSAR processes', 'implementation', 90 FROM compliance_frameworks WHERE framework_code = 'GDPR'
UNION ALL
SELECT id, 5, 'DPIA and Testing', 'Conduct Data Protection Impact Assessments and test procedures', 'testing', 30 FROM compliance_frameworks WHERE framework_code = 'GDPR'
UNION ALL
SELECT id, 6, 'Documentation Review', 'Complete Records of Processing Activities and compliance documentation', 'audit_prep', 21 FROM compliance_frameworks WHERE framework_code = 'GDPR'
UNION ALL
SELECT id, 7, 'Ongoing Compliance', 'Establish continuous monitoring and supervisory authority engagement', 'certification', 14 FROM compliance_frameworks WHERE framework_code = 'GDPR';

-- Insert FISMA roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'System Categorization', 'Categorize information system per FIPS 199 (Low, Moderate, High)', 'assessment', 14 FROM compliance_frameworks WHERE framework_code = 'FISMA'
UNION ALL
SELECT id, 2, 'Control Selection', 'Select security controls from NIST SP 800-53 baseline', 'gap_analysis', 21 FROM compliance_frameworks WHERE framework_code = 'FISMA'
UNION ALL
SELECT id, 3, 'System Security Plan', 'Develop comprehensive SSP documenting all controls', 'planning', 30 FROM compliance_frameworks WHERE framework_code = 'FISMA'
UNION ALL
SELECT id, 4, 'Control Implementation', 'Implement selected security controls per NIST guidelines', 'implementation', 120 FROM compliance_frameworks WHERE framework_code = 'FISMA'
UNION ALL
SELECT id, 5, 'Security Assessment', 'Conduct independent security control assessment', 'testing', 45 FROM compliance_frameworks WHERE framework_code = 'FISMA'
UNION ALL
SELECT id, 6, 'Plan of Action', 'Develop POA&M for any deficiencies and prepare ATO package', 'audit_prep', 30 FROM compliance_frameworks WHERE framework_code = 'FISMA'
UNION ALL
SELECT id, 7, 'Authorization', 'Obtain Authority to Operate (ATO) from authorizing official', 'certification', 30 FROM compliance_frameworks WHERE framework_code = 'FISMA';

-- Insert CCPA roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'CCPA Applicability', 'Determine CCPA applicability and consumer data inventory', 'assessment', 14 FROM compliance_frameworks WHERE framework_code = 'CCPA'
UNION ALL
SELECT id, 2, 'Data Practices Review', 'Review data collection, sharing, and sales practices', 'gap_analysis', 21 FROM compliance_frameworks WHERE framework_code = 'CCPA'
UNION ALL
SELECT id, 3, 'Privacy Notice Update', 'Update privacy policy with CCPA-required disclosures', 'planning', 14 FROM compliance_frameworks WHERE framework_code = 'CCPA'
UNION ALL
SELECT id, 4, 'Consumer Rights Implementation', 'Implement right to know, delete, opt-out mechanisms', 'implementation', 60 FROM compliance_frameworks WHERE framework_code = 'CCPA'
UNION ALL
SELECT id, 5, 'Request Handling Process', 'Establish verified consumer request handling procedures', 'testing', 30 FROM compliance_frameworks WHERE framework_code = 'CCPA'
UNION ALL
SELECT id, 6, 'Vendor Management', 'Update contracts with service providers and third parties', 'audit_prep', 21 FROM compliance_frameworks WHERE framework_code = 'CCPA'
UNION ALL
SELECT id, 7, 'Compliance Monitoring', 'Establish ongoing compliance monitoring and training', 'certification', 14 FROM compliance_frameworks WHERE framework_code = 'CCPA';

-- Insert ISO 9001 roadmap templates
INSERT INTO public.compliance_roadmap_stage_templates (framework_id, stage_number, stage_name, stage_description, stage_type, estimated_duration_days)
SELECT id, 1, 'QMS Scoping', 'Define Quality Management System scope and context', 'assessment', 14 FROM compliance_frameworks WHERE framework_code = 'ISO-9001'
UNION ALL
SELECT id, 2, 'Process Mapping', 'Map organizational processes and identify quality objectives', 'gap_analysis', 21 FROM compliance_frameworks WHERE framework_code = 'ISO-9001'
UNION ALL
SELECT id, 3, 'QMS Documentation', 'Develop quality manual, procedures, and work instructions', 'planning', 30 FROM compliance_frameworks WHERE framework_code = 'ISO-9001'
UNION ALL
SELECT id, 4, 'QMS Implementation', 'Implement quality processes, controls, and monitoring', 'implementation', 90 FROM compliance_frameworks WHERE framework_code = 'ISO-9001'
UNION ALL
SELECT id, 5, 'Internal Audit', 'Conduct internal quality audits and management review', 'testing', 30 FROM compliance_frameworks WHERE framework_code = 'ISO-9001'
UNION ALL
SELECT id, 6, 'Corrective Actions', 'Address non-conformities and prepare for certification audit', 'audit_prep', 21 FROM compliance_frameworks WHERE framework_code = 'ISO-9001'
UNION ALL
SELECT id, 7, 'ISO 9001 Certification', 'Complete certification audit and achieve ISO 9001 registration', 'certification', 30 FROM compliance_frameworks WHERE framework_code = 'ISO-9001';

-- Update initialize function to use templates
CREATE OR REPLACE FUNCTION public.initialize_compliance_roadmap(_framework_id uuid, _customer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  first_stage_id UUID;
  stage_rec RECORD;
  new_stage_id UUID;
  milestone_rec RECORD;
BEGIN
  -- Copy stages from templates
  FOR stage_rec IN 
    SELECT * FROM compliance_roadmap_stage_templates 
    WHERE framework_id = _framework_id 
    ORDER BY stage_number
  LOOP
    INSERT INTO compliance_roadmap_stages (
      framework_id, customer_id, stage_number, stage_name, 
      stage_description, stage_type, estimated_duration_days, status, progress_percentage
    ) VALUES (
      _framework_id, _customer_id, stage_rec.stage_number, stage_rec.stage_name,
      stage_rec.stage_description, stage_rec.stage_type, stage_rec.estimated_duration_days, 
      'not_started', 0
    ) RETURNING id INTO new_stage_id;
    
    IF first_stage_id IS NULL THEN
      first_stage_id := new_stage_id;
    END IF;
    
    -- Copy milestones for this stage
    FOR milestone_rec IN
      SELECT * FROM compliance_roadmap_milestone_templates
      WHERE stage_template_id = stage_rec.id
      ORDER BY sequence_order
    LOOP
      INSERT INTO compliance_roadmap_milestones (
        stage_id, customer_id, sequence_order, milestone_name,
        milestone_description, required_actions, success_criteria,
        evidence_required, status
      ) VALUES (
        new_stage_id, _customer_id, milestone_rec.sequence_order, milestone_rec.milestone_name,
        milestone_rec.milestone_description, milestone_rec.required_actions, milestone_rec.success_criteria,
        milestone_rec.evidence_required, 'pending'
      );
    END LOOP;
  END LOOP;
  
  RETURN first_stage_id;
END;
$function$;