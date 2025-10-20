-- Create compliance roadmap tables for tracking customer compliance journey

-- Compliance journey stages
CREATE TABLE compliance_roadmap_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL CHECK (validate_text_input(stage_name, 200, 'stage_name')),
  stage_description TEXT CHECK (validate_text_input(stage_description, 1000, 'stage_description')),
  stage_type TEXT NOT NULL CHECK (stage_type IN ('assessment', 'gap_analysis', 'planning', 'implementation', 'testing', 'audit_prep', 'certification')),
  estimated_duration_days INTEGER,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(framework_id, customer_id, stage_number)
);

-- Roadmap milestones within each stage
CREATE TABLE compliance_roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES compliance_roadmap_stages(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  milestone_name TEXT NOT NULL CHECK (validate_text_input(milestone_name, 200, 'milestone_name')),
  milestone_description TEXT CHECK (validate_text_input(milestone_description, 2000, 'milestone_description')),
  sequence_order INTEGER NOT NULL,
  required_actions TEXT[] CHECK (validate_array_input(required_actions, 50, 500, 'required_actions')),
  success_criteria TEXT[] CHECK (validate_array_input(success_criteria, 20, 500, 'success_criteria')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'skipped')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  evidence_required BOOLEAN DEFAULT false,
  linked_control_ids TEXT[] CHECK (validate_array_input(linked_control_ids, 100, 100, 'linked_control_ids')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roadmap resources and templates
CREATE TABLE compliance_roadmap_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES compliance_roadmap_stages(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES compliance_roadmap_milestones(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  resource_name TEXT NOT NULL CHECK (validate_text_input(resource_name, 200, 'resource_name')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'template', 'checklist', 'guide', 'video', 'tool', 'external_link')),
  resource_url TEXT CHECK (validate_text_input(resource_url, 500, 'resource_url')),
  resource_description TEXT CHECK (validate_text_input(resource_description, 1000, 'resource_description')),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (stage_id IS NOT NULL OR milestone_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE compliance_roadmap_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_roadmap_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_roadmap_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roadmap stages
CREATE POLICY "Users can view their customer roadmap stages"
ON compliance_roadmap_stages FOR SELECT
USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their customer roadmap stages"
ON compliance_roadmap_stages FOR INSERT
WITH CHECK (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their customer roadmap stages"
ON compliance_roadmap_stages FOR UPDATE
USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- RLS Policies for milestones
CREATE POLICY "Users can view their customer milestones"
ON compliance_roadmap_milestones FOR SELECT
USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their customer milestones"
ON compliance_roadmap_milestones FOR INSERT
WITH CHECK (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their customer milestones"
ON compliance_roadmap_milestones FOR UPDATE
USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- RLS Policies for resources
CREATE POLICY "Users can view their customer resources"
ON compliance_roadmap_resources FOR SELECT
USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their customer resources"
ON compliance_roadmap_resources FOR INSERT
WITH CHECK (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_roadmap_stages_customer ON compliance_roadmap_stages(customer_id);
CREATE INDEX idx_roadmap_stages_framework ON compliance_roadmap_stages(framework_id);
CREATE INDEX idx_roadmap_stages_status ON compliance_roadmap_stages(status);
CREATE INDEX idx_roadmap_milestones_stage ON compliance_roadmap_milestones(stage_id);
CREATE INDEX idx_roadmap_milestones_customer ON compliance_roadmap_milestones(customer_id);
CREATE INDEX idx_roadmap_milestones_status ON compliance_roadmap_milestones(status);
CREATE INDEX idx_roadmap_resources_customer ON compliance_roadmap_resources(customer_id);

-- Trigger to update updated_at
CREATE TRIGGER update_roadmap_stages_updated_at
  BEFORE UPDATE ON compliance_roadmap_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_milestones_updated_at
  BEFORE UPDATE ON compliance_roadmap_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize roadmap for a framework
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
  framework_code TEXT;
  stage_id UUID;
BEGIN
  -- Get framework code
  SELECT framework_code INTO framework_code
  FROM compliance_frameworks
  WHERE id = _framework_id;

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