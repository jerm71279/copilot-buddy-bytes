-- Create ai_insights table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  insight TEXT NOT NULL,
  context TEXT,
  domains TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own insights"
  ON public.ai_insights
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create insights"
  ON public.ai_insights
  FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_ai_insights_created_at ON public.ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_user_id ON public.ai_insights(user_id);
