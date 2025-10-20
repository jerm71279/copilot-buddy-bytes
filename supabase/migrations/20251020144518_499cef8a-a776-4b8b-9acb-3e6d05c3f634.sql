-- Fix ambiguous column reference in initialize_compliance_roadmap function
CREATE OR REPLACE FUNCTION initialize_compliance_roadmap(
  _framework_id UUID,
  _customer_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_framework_code TEXT;
  stage_id UUID;
BEGIN
  -- Get framework code
  SELECT cf.framework_code INTO v_framework_code
  FROM compliance_frameworks cf
  WHERE cf.id = _framework_id;

  -- Create standard stages based on framework type
  -- Stage 1: Initial Assessment
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name, 
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 1, 'Initial Assessment',
    'Evaluate current security posture and compliance readiness', 
    'assessment', 14
  ) RETURNING id INTO stage_id;

  -- Stage 2: Gap Analysis
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 2, 'Gap Analysis',
    'Identify gaps between current state and compliance requirements',
    'gap_analysis', 21
  );

  -- Stage 3: Remediation Planning
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 3, 'Remediation Planning',
    'Develop detailed plan to address identified gaps',
    'planning', 14
  );

  -- Stage 4: Implementation
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 4, 'Implementation',
    'Execute remediation plan and implement required controls',
    'implementation', 90
  );

  -- Stage 5: Testing & Validation
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 5, 'Testing & Validation',
    'Test controls and validate effectiveness',
    'testing', 30
  );

  -- Stage 6: Audit Preparation
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 6, 'Audit Preparation',
    'Prepare documentation and evidence for formal audit',
    'audit_prep', 21
  );

  -- Stage 7: Certification
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 7, 'Certification',
    'Complete formal audit and achieve certification',
    'certification', 30
  );

  RETURN stage_id;
END;
$$;