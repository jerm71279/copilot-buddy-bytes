-- Update initialize_compliance_roadmap to sanitize all text inputs
CREATE OR REPLACE FUNCTION public.initialize_compliance_roadmap(_framework_id uuid, _customer_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stage_id UUID;
BEGIN
  -- Stage 1: Initial Assessment
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name, 
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 1, 
    strip_control_chars('Initial Assessment'),
    strip_control_chars('Evaluate current security posture and compliance readiness'), 
    'assessment', 14
  ) RETURNING id INTO stage_id;

  -- Stage 2: Gap Analysis
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 2, 
    strip_control_chars('Gap Analysis'),
    strip_control_chars('Identify gaps between current state and compliance requirements'),
    'gap_analysis', 21
  );

  -- Stage 3: Remediation Planning
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 3, 
    strip_control_chars('Remediation Planning'),
    strip_control_chars('Develop detailed plan to address identified gaps'),
    'planning', 14
  );

  -- Stage 4: Implementation
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 4, 
    strip_control_chars('Implementation'),
    strip_control_chars('Execute remediation plan and implement required controls'),
    'implementation', 90
  );

  -- Stage 5: Testing & Validation
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 5, 
    strip_control_chars('Testing & Validation'),
    strip_control_chars('Test controls and validate effectiveness'),
    'testing', 30
  );

  -- Stage 6: Audit Preparation
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 6, 
    strip_control_chars('Audit Preparation'),
    strip_control_chars('Prepare documentation and evidence for formal audit'),
    'audit_prep', 21
  );

  -- Stage 7: Certification
  INSERT INTO compliance_roadmap_stages (
    framework_id, customer_id, stage_number, stage_name,
    stage_description, stage_type, estimated_duration_days
  ) VALUES (
    _framework_id, _customer_id, 7, 
    strip_control_chars('Certification'),
    strip_control_chars('Complete formal audit and achieve certification'),
    'certification', 30
  );

  RETURN stage_id;
END;
$function$;