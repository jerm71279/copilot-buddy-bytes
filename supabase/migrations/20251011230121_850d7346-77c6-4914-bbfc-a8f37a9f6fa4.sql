-- Risk Management Schema
-- Creates a comprehensive risk management system integrated with existing security infrastructure

-- Risk categories and types
CREATE TYPE risk_category AS ENUM (
  'cybersecurity',
  'operational',
  'financial',
  'compliance',
  'strategic',
  'reputational'
);

CREATE TYPE risk_likelihood AS ENUM (
  'rare',
  'unlikely',
  'possible',
  'likely',
  'almost_certain'
);

CREATE TYPE risk_impact AS ENUM (
  'negligible',
  'minor',
  'moderate',
  'major',
  'catastrophic'
);

CREATE TYPE risk_status AS ENUM (
  'identified',
  'assessed',
  'treated',
  'monitored',
  'closed',
  'accepted'
);

CREATE TYPE risk_treatment_type AS ENUM (
  'mitigate',
  'transfer',
  'avoid',
  'accept'
);

-- Main risk register table
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  risk_id TEXT UNIQUE NOT NULL,
  risk_title TEXT NOT NULL,
  risk_description TEXT NOT NULL,
  category risk_category NOT NULL,
  
  -- Risk scoring
  inherent_likelihood risk_likelihood NOT NULL,
  inherent_impact risk_impact NOT NULL,
  inherent_score INTEGER NOT NULL, -- calculated: likelihood x impact (1-25)
  
  residual_likelihood risk_likelihood,
  residual_impact risk_impact,
  residual_score INTEGER, -- after controls
  
  -- Risk metadata
  status risk_status NOT NULL DEFAULT 'identified',
  risk_owner_id UUID,
  identified_by UUID NOT NULL,
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Treatment
  treatment_type risk_treatment_type,
  treatment_plan TEXT,
  treatment_deadline DATE,
  
  -- Integration references
  related_incidents UUID[], -- links to incidents table
  related_changes UUID[], -- links to change_requests
  related_compliance_findings UUID[], -- links to compliance issues
  related_vulnerabilities UUID[], -- links to anomaly_detections
  
  -- Review tracking
  last_review_date DATE,
  next_review_date DATE,
  review_frequency_days INTEGER DEFAULT 90,
  
  -- Compliance and tags
  compliance_frameworks TEXT[],
  tags TEXT[],
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID
);

-- Risk controls/mitigations
CREATE TABLE risk_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  risk_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
  
  control_id TEXT UNIQUE NOT NULL,
  control_name TEXT NOT NULL,
  control_description TEXT NOT NULL,
  control_type TEXT NOT NULL, -- preventive, detective, corrective
  
  -- Effectiveness
  implementation_status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, implemented, verified
  effectiveness_rating TEXT, -- ineffective, partially_effective, effective, highly_effective
  
  -- Ownership
  control_owner_id UUID,
  
  -- Testing
  last_tested_date DATE,
  next_test_date DATE,
  test_frequency_days INTEGER DEFAULT 180,
  test_results TEXT,
  
  -- Evidence
  evidence_references UUID[], -- links to evidence_files table
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Risk treatment tracking
CREATE TABLE risk_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  risk_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
  
  treatment_action TEXT NOT NULL,
  treatment_description TEXT NOT NULL,
  
  -- Assignment
  assigned_to UUID,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  
  -- Timeline
  start_date DATE,
  due_date DATE NOT NULL,
  completed_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  -- Resources
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  
  -- Notes
  notes TEXT,
  completion_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Risk events/incidents log
CREATE TABLE risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  risk_id UUID REFERENCES risk_assessments(id) ON DELETE SET NULL,
  
  event_date DATE NOT NULL,
  event_description TEXT NOT NULL,
  event_type TEXT NOT NULL, -- realization, near_miss, control_failure, new_threat
  
  -- Impact
  actual_impact TEXT,
  financial_impact NUMERIC(12,2),
  
  -- Response
  response_actions TEXT,
  lessons_learned TEXT,
  
  -- References
  incident_id UUID, -- link to incidents table
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_risk_assessments_customer ON risk_assessments(customer_id);
CREATE INDEX idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX idx_risk_assessments_owner ON risk_assessments(risk_owner_id);
CREATE INDEX idx_risk_assessments_category ON risk_assessments(category);
CREATE INDEX idx_risk_controls_risk ON risk_controls(risk_id);
CREATE INDEX idx_risk_treatments_risk ON risk_treatments(risk_id);
CREATE INDEX idx_risk_treatments_assigned ON risk_treatments(assigned_to);
CREATE INDEX idx_risk_events_risk ON risk_events(risk_id);

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
  likelihood risk_likelihood,
  impact risk_impact
) RETURNS INTEGER AS $$
DECLARE
  likelihood_value INTEGER;
  impact_value INTEGER;
BEGIN
  -- Map likelihood to numeric value (1-5)
  likelihood_value := CASE likelihood
    WHEN 'rare' THEN 1
    WHEN 'unlikely' THEN 2
    WHEN 'possible' THEN 3
    WHEN 'likely' THEN 4
    WHEN 'almost_certain' THEN 5
  END;
  
  -- Map impact to numeric value (1-5)
  impact_value := CASE impact
    WHEN 'negligible' THEN 1
    WHEN 'minor' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'major' THEN 4
    WHEN 'catastrophic' THEN 5
  END;
  
  RETURN likelihood_value * impact_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate risk scores
CREATE OR REPLACE FUNCTION update_risk_scores()
RETURNS TRIGGER AS $$
BEGIN
  NEW.inherent_score := calculate_risk_score(NEW.inherent_likelihood, NEW.inherent_impact);
  
  IF NEW.residual_likelihood IS NOT NULL AND NEW.residual_impact IS NOT NULL THEN
    NEW.residual_score := calculate_risk_score(NEW.residual_likelihood, NEW.residual_impact);
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_risk_scores_trigger
  BEFORE INSERT OR UPDATE ON risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_scores();

-- Trigger to update timestamps
CREATE TRIGGER update_risk_controls_timestamp
  BEFORE UPDATE ON risk_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_treatments_timestamp
  BEFORE UPDATE ON risk_treatments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risk_assessments
CREATE POLICY "Users can view risks in their organization"
  ON risk_assessments FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create risks in their organization"
  ON risk_assessments FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Risk owners and admins can update risks"
  ON risk_assessments FOR UPDATE
  USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND (risk_owner_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can delete risks"
  ON risk_assessments FOR DELETE
  USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- RLS Policies for risk_controls
CREATE POLICY "Users can view controls in their organization"
  ON risk_controls FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create controls"
  ON risk_controls FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Control owners and admins can update controls"
  ON risk_controls FOR UPDATE
  USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND (control_owner_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  );

-- RLS Policies for risk_treatments
CREATE POLICY "Users can view treatments in their organization"
  ON risk_treatments FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create treatments"
  ON risk_treatments FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Assigned users and admins can update treatments"
  ON risk_treatments FOR UPDATE
  USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND (assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'))
  );

-- RLS Policies for risk_events
CREATE POLICY "Users can view risk events in their organization"
  ON risk_events FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create risk events"
  ON risk_events FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

-- Generate risk ID function
CREATE OR REPLACE FUNCTION generate_risk_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RISK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-generate risk_id
CREATE OR REPLACE FUNCTION set_risk_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.risk_id IS NULL OR NEW.risk_id = '' THEN
    NEW.risk_id := generate_risk_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_risk_id_trigger
  BEFORE INSERT ON risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION set_risk_id();

-- Generate control ID function
CREATE OR REPLACE FUNCTION generate_control_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CTRL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_control_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.control_id IS NULL OR NEW.control_id = '' THEN
    NEW.control_id := generate_control_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_control_id_trigger
  BEFORE INSERT ON risk_controls
  FOR EACH ROW
  EXECUTE FUNCTION set_control_id();