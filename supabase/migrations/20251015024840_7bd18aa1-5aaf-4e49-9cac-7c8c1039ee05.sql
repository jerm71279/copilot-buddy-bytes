-- Comprehensive Security Training Enhancement

-- Add quiz/assessment questions table
CREATE TABLE IF NOT EXISTS public.security_training_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.security_training_modules(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'multi_select')),
  options JSONB NOT NULL, -- Array of answer options
  correct_answers JSONB NOT NULL, -- Array of correct answer indices or values
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User answers to quiz questions
CREATE TABLE IF NOT EXISTS public.security_training_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID NOT NULL REFERENCES public.security_training_completions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.security_training_questions(id) ON DELETE CASCADE,
  user_answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(completion_id, question_id)
);

-- Phishing simulation campaigns
CREATE TABLE IF NOT EXISTS public.phishing_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  description TEXT,
  simulation_type TEXT NOT NULL CHECK (simulation_type IN ('email', 'sms', 'voice', 'social_media')),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'advanced')),
  template_content JSONB NOT NULL, -- Email/message template with variables
  target_indicators JSONB, -- What makes this phishing (red flags)
  educational_content TEXT, -- What users should learn
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track individual phishing simulation attempts
CREATE TABLE IF NOT EXISTS public.phishing_simulation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES public.phishing_simulations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_link BOOLEAN NOT NULL DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  reported_phishing BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMP WITH TIME ZONE,
  completed_training BOOLEAN NOT NULL DEFAULT false,
  training_completed_at TIMESTAMP WITH TIME ZONE,
  result TEXT NOT NULL CHECK (result IN ('pending', 'failed', 'passed', 'reported')) DEFAULT 'pending',
  time_to_action_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security training certificates
CREATE TABLE IF NOT EXISTS public.security_training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID NOT NULL REFERENCES public.security_training_completions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.security_training_modules(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  certificate_data JSONB, -- Full certificate details for regeneration
  pdf_url TEXT,
  verification_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Training reminders and notifications
CREATE TABLE IF NOT EXISTS public.security_training_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  module_id UUID REFERENCES public.security_training_modules(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('overdue', 'due_soon', 'new_module', 'recertification')),
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_training_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phishing_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phishing_simulation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_training_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_training_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions
CREATE POLICY "Users can view questions for their modules"
  ON public.security_training_questions FOR SELECT
  USING (module_id IN (
    SELECT module_id FROM security_training_completions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage questions"
  ON public.security_training_questions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for answers
CREATE POLICY "Users can view their own answers"
  ON public.security_training_answers FOR SELECT
  USING (completion_id IN (
    SELECT id FROM security_training_completions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own answers"
  ON public.security_training_answers FOR INSERT
  WITH CHECK (completion_id IN (
    SELECT id FROM security_training_completions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all answers"
  ON public.security_training_answers FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for phishing simulations
CREATE POLICY "Users can view active phishing simulations in their org"
  ON public.phishing_simulations FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ) AND is_active = true);

CREATE POLICY "Admins can manage phishing simulations"
  ON public.phishing_simulations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for phishing attempts
CREATE POLICY "Users can view their own phishing attempts"
  ON public.phishing_simulation_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert phishing attempts"
  ON public.phishing_simulation_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own attempts"
  ON public.phishing_simulation_attempts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all phishing attempts"
  ON public.phishing_simulation_attempts FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for certificates
CREATE POLICY "Users can view their own certificates"
  ON public.security_training_certificates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can issue certificates"
  ON public.security_training_certificates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all certificates"
  ON public.security_training_certificates FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for reminders
CREATE POLICY "Users can view their own reminders"
  ON public.security_training_reminders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can acknowledge their reminders"
  ON public.security_training_reminders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create reminders"
  ON public.security_training_reminders FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_training_questions_module ON public.security_training_questions(module_id);
CREATE INDEX idx_training_answers_completion ON public.security_training_answers(completion_id);
CREATE INDEX idx_training_answers_question ON public.security_training_answers(question_id);
CREATE INDEX idx_phishing_simulations_customer ON public.phishing_simulations(customer_id);
CREATE INDEX idx_phishing_attempts_user ON public.phishing_simulation_attempts(user_id);
CREATE INDEX idx_phishing_attempts_simulation ON public.phishing_simulation_attempts(simulation_id);
CREATE INDEX idx_phishing_attempts_result ON public.phishing_simulation_attempts(result);
CREATE INDEX idx_certificates_user ON public.security_training_certificates(user_id);
CREATE INDEX idx_certificates_verification ON public.security_training_certificates(verification_code);
CREATE INDEX idx_reminders_user ON public.security_training_reminders(user_id);
CREATE INDEX idx_reminders_due_date ON public.security_training_reminders(due_date);

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'CERT' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
END;
$$;

-- Function to automatically issue certificate on training completion
CREATE OR REPLACE FUNCTION issue_training_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cert_number TEXT;
  verify_code TEXT;
BEGIN
  -- Only issue certificate if training was passed
  IF NEW.passed = true AND NEW.completed_at IS NOT NULL AND OLD.certificate_issued = false THEN
    cert_number := generate_certificate_number();
    verify_code := SUBSTRING(MD5(random()::text || clock_timestamp()::text) FROM 1 FOR 12);
    
    INSERT INTO security_training_certificates (
      completion_id,
      user_id,
      customer_id,
      module_id,
      certificate_number,
      verification_code,
      expires_at,
      certificate_data
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.customer_id,
      NEW.module_id,
      cert_number,
      verify_code,
      NEW.completed_at + INTERVAL '1 year', -- Certificate valid for 1 year
      jsonb_build_object(
        'score', NEW.score,
        'completion_date', NEW.completed_at,
        'module_id', NEW.module_id
      )
    );
    
    -- Mark certificate as issued
    NEW.certificate_issued := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-issue certificates
CREATE TRIGGER auto_issue_certificate
  BEFORE UPDATE ON public.security_training_completions
  FOR EACH ROW
  WHEN (NEW.passed = true AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION issue_training_certificate();

-- Add updated_at triggers
CREATE TRIGGER update_phishing_simulations_updated_at
  BEFORE UPDATE ON public.phishing_simulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();