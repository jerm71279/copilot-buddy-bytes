-- Phase 4: Feedback Distribution
-- Store feedback from global insights back to departments

CREATE TABLE IF NOT EXISTS public.insight_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  department TEXT NOT NULL,
  global_insight_id UUID REFERENCES public.global_insights(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL, -- 'recommendation', 'warning', 'best_practice', 'pattern'
  feedback_content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  applied BOOLEAN DEFAULT false,
  application_notes TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insight_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for insight_feedback
CREATE POLICY "Users can view feedback for their organization"
  ON public.insight_feedback
  FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert feedback"
  ON public.insight_feedback
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update feedback in their organization"
  ON public.insight_feedback
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX idx_insight_feedback_department ON public.insight_feedback(department, customer_id);
CREATE INDEX idx_insight_feedback_priority ON public.insight_feedback(priority, acknowledged);
CREATE INDEX idx_insight_feedback_expires ON public.insight_feedback(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_insight_feedback_updated_at
  BEFORE UPDATE ON public.insight_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();