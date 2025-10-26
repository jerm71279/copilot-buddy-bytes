-- A/B Testing Framework for AI Response Strategies
CREATE TABLE IF NOT EXISTS public.ai_ab_test_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  prompt_strategy JSONB NOT NULL,
  model_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(customer_id, test_name, variant_name)
);

CREATE TABLE IF NOT EXISTS public.ai_ab_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  variant_id UUID NOT NULL REFERENCES public.ai_ab_test_variants(id) ON DELETE CASCADE,
  user_id UUID,
  query_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  confidence_score NUMERIC(4,3),
  response_time_ms INTEGER NOT NULL,
  was_helpful BOOLEAN,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced correlation tracking with graph relationships
CREATE TABLE IF NOT EXISTS public.insight_correlation_graph (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  insight_a_id UUID NOT NULL,
  insight_b_id UUID NOT NULL,
  correlation_type TEXT NOT NULL, -- temporal, causal, thematic, inverse, reinforcing
  correlation_strength NUMERIC(4,3) NOT NULL CHECK (correlation_strength BETWEEN 0 AND 1),
  confidence_score NUMERIC(4,3) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  edge_weight NUMERIC(6,3) DEFAULT 1.0,
  path_distance INTEGER DEFAULT 1,
  supporting_evidence JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Predictive model tuning and optimization
CREATE TABLE IF NOT EXISTS public.ai_model_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  use_case TEXT NOT NULL,
  avg_confidence_score NUMERIC(4,3),
  avg_response_time_ms INTEGER,
  success_rate NUMERIC(5,2),
  user_satisfaction NUMERIC(3,2),
  total_invocations INTEGER DEFAULT 0,
  sample_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  sample_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  optimal_temperature NUMERIC(3,2),
  optimal_max_tokens INTEGER,
  cost_per_invocation NUMERIC(10,4),
  metadata JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_correlation_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their customer's AB test variants"
  ON public.ai_ab_test_variants FOR SELECT
  USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can manage AB test variants"
  ON public.ai_ab_test_variants FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their customer's AB test results"
  ON public.ai_ab_test_results FOR SELECT
  USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert AB test results"
  ON public.ai_ab_test_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their customer's correlation graph"
  ON public.insight_correlation_graph FOR SELECT
  USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can manage correlation graph"
  ON public.insight_correlation_graph FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their customer's model performance"
  ON public.ai_model_performance FOR SELECT
  USING (customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can manage model performance"
  ON public.ai_model_performance FOR ALL
  USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_ab_variants_customer ON public.ai_ab_test_variants(customer_id, test_name);
CREATE INDEX idx_ab_results_variant ON public.ai_ab_test_results(variant_id, created_at DESC);
CREATE INDEX idx_ab_results_customer ON public.ai_ab_test_results(customer_id, created_at DESC);
CREATE INDEX idx_correlation_graph_customer ON public.insight_correlation_graph(customer_id);
CREATE INDEX idx_correlation_graph_insights ON public.insight_correlation_graph(insight_a_id, insight_b_id);
CREATE INDEX idx_model_performance_customer ON public.ai_model_performance(customer_id, model_name);
CREATE INDEX idx_model_performance_use_case ON public.ai_model_performance(use_case, sample_period_end DESC);