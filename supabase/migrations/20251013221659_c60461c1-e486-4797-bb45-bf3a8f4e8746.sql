-- Security Training and Internal Operations Tables

-- Security training modules table
CREATE TABLE public.security_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  module_name TEXT NOT NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('data_handling', 'confidentiality', 'acceptable_use', 'incident_response', 'compliance', 'platform_security')),
  description TEXT,
  content TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  target_roles TEXT[] DEFAULT ARRAY['user']::TEXT[],
  version INTEGER NOT NULL DEFAULT 1,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security training completions tracking
CREATE TABLE public.security_training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.security_training_modules(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  time_spent_minutes INTEGER,
  certificate_issued BOOLEAN NOT NULL DEFAULT false,
  certificate_url TEXT,
  notes TEXT,
  UNIQUE(user_id, module_id)
);

-- Security policy acknowledgments
CREATE TABLE public.security_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('security_policy', 'data_handling', 'acceptable_use', 'confidentiality', 'incident_reporting')),
  policy_version TEXT NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  acknowledgment_text TEXT NOT NULL,
  signature_data TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Employee feedback for internal operations
CREATE TABLE public.employee_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature_request', 'usability', 'performance', 'security', 'training', 'documentation', 'general')),
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_module TEXT,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'wont_fix', 'duplicate')) DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  upvotes INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Employee champions program
CREATE TABLE public.employee_champions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  champion_type TEXT NOT NULL CHECK (champion_type IN ('platform_expert', 'security_advocate', 'training_leader', 'feedback_coordinator')),
  department TEXT,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expertise_areas TEXT[],
  contributions_count INTEGER DEFAULT 0,
  feedback_provided_count INTEGER DEFAULT 0,
  training_sessions_led INTEGER DEFAULT 0,
  recognition_notes TEXT,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, champion_type)
);

-- Internal operations metrics
CREATE TABLE public.internal_operations_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_employees INTEGER DEFAULT 0,
  training_completion_rate NUMERIC(5,2),
  security_acknowledgment_rate NUMERIC(5,2),
  feedback_submissions_count INTEGER DEFAULT 0,
  feedback_resolution_rate NUMERIC(5,2),
  platform_adoption_rate NUMERIC(5,2),
  average_session_duration_minutes INTEGER,
  support_tickets_created INTEGER DEFAULT 0,
  support_tickets_resolved INTEGER DEFAULT 0,
  champion_activity_score INTEGER,
  readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
  metrics_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.security_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_operations_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_training_modules
CREATE POLICY "Users can view training modules in their organization"
  ON public.security_training_modules FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage training modules"
  ON public.security_training_modules FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for security_training_completions
CREATE POLICY "Users can view their own training completions"
  ON public.security_training_completions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own training completions"
  ON public.security_training_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own training completions"
  ON public.security_training_completions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all training completions"
  ON public.security_training_completions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for security_acknowledgments
CREATE POLICY "Users can view their own acknowledgments"
  ON public.security_acknowledgments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own acknowledgments"
  ON public.security_acknowledgments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all acknowledgments"
  ON public.security_acknowledgments FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for employee_feedback
CREATE POLICY "Users can view feedback in their organization"
  ON public.employee_feedback FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create feedback"
  ON public.employee_feedback FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can update their own feedback"
  ON public.employee_feedback FOR UPDATE
  USING (submitted_by = auth.uid());

CREATE POLICY "Admins can manage all feedback"
  ON public.employee_feedback FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for employee_champions
CREATE POLICY "Users can view champions in their organization"
  ON public.employee_champions FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage champions"
  ON public.employee_champions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for internal_operations_metrics
CREATE POLICY "Admins can view operations metrics"
  ON public.internal_operations_metrics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert operations metrics"
  ON public.internal_operations_metrics FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_training_completions_user ON public.security_training_completions(user_id);
CREATE INDEX idx_training_completions_module ON public.security_training_completions(module_id);
CREATE INDEX idx_security_acknowledgments_user ON public.security_acknowledgments(user_id);
CREATE INDEX idx_employee_feedback_submitted_by ON public.employee_feedback(submitted_by);
CREATE INDEX idx_employee_feedback_status ON public.employee_feedback(status);
CREATE INDEX idx_employee_champions_user ON public.employee_champions(user_id);
CREATE INDEX idx_internal_operations_metrics_date ON public.internal_operations_metrics(metric_date DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_security_training_modules_updated_at
  BEFORE UPDATE ON public.security_training_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_feedback_updated_at
  BEFORE UPDATE ON public.employee_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_champions_updated_at
  BEFORE UPDATE ON public.employee_champions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();