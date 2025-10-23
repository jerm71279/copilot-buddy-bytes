-- Create prompt cache table for cost and speed optimization
CREATE TABLE IF NOT EXISTS public.ai_prompt_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  cache_key TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  cached_tokens INTEGER NOT NULL DEFAULT 0,
  response_data JSONB NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(customer_id, cache_key)
);

-- Create vision analysis table to track image processing
CREATE TABLE IF NOT EXISTS public.ai_vision_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  model_used TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_prompt_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_vision_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_prompt_cache (allow service role full access for edge functions)
CREATE POLICY "Service role can manage cache"
  ON public.ai_prompt_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their cache"
  ON public.ai_prompt_cache
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for ai_vision_analysis
CREATE POLICY "Service role can manage vision"
  ON public.ai_vision_analysis
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their vision analysis"
  ON public.ai_vision_analysis
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create vision analysis"
  ON public.ai_vision_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_prompt_cache_customer_key ON public.ai_prompt_cache(customer_id, cache_key);
CREATE INDEX idx_prompt_cache_expires ON public.ai_prompt_cache(expires_at);
CREATE INDEX idx_prompt_cache_user ON public.ai_prompt_cache(user_id);
CREATE INDEX idx_vision_analysis_customer ON public.ai_vision_analysis(customer_id);
CREATE INDEX idx_vision_analysis_user ON public.ai_vision_analysis(user_id);
CREATE INDEX idx_vision_analysis_created ON public.ai_vision_analysis(created_at DESC);

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_prompt_cache WHERE expires_at < now();
END;
$$;