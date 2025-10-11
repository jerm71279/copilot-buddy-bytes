-- Phase 3: Central MML Engine Tables

-- Global insights from cross-department analysis
CREATE TABLE IF NOT EXISTS global_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('cross_department_pattern', 'organizational_risk', 'efficiency_opportunity', 'knowledge_gap', 'process_improvement', 'resource_optimization')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_departments TEXT[] NOT NULL DEFAULT '{}',
  source_insight_ids UUID[] NOT NULL DEFAULT '{}',
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),
  recommended_actions JSONB DEFAULT '[]',
  expected_impact TEXT,
  implementation_complexity TEXT CHECK (implementation_complexity IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'under_review', 'approved', 'in_progress', 'implemented', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track correlations between insights
CREATE TABLE IF NOT EXISTS insight_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  insight_a_id UUID NOT NULL,
  insight_b_id UUID NOT NULL,
  correlation_type TEXT NOT NULL CHECK (correlation_type IN ('causal', 'temporal', 'similar', 'contradictory', 'complementary')),
  correlation_strength NUMERIC CHECK (correlation_strength >= 0 AND correlation_strength <= 1),
  description TEXT,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(insight_a_id, insight_b_id, correlation_type)
);

-- Enable RLS
ALTER TABLE global_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_correlations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for global_insights
CREATE POLICY "Users can view global insights in their organization"
  ON global_insights FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage global insights"
  ON global_insights FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert global insights"
  ON global_insights FOR INSERT
  WITH CHECK (true);

-- RLS Policies for insight_correlations
CREATE POLICY "Users can view correlations in their organization"
  ON insight_correlations FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage correlations"
  ON insight_correlations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add global_insight_id reference to department_insights
ALTER TABLE department_insights 
ADD COLUMN IF NOT EXISTS global_insight_id UUID REFERENCES global_insights(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_insights_customer ON global_insights(customer_id);
CREATE INDEX IF NOT EXISTS idx_global_insights_status ON global_insights(status);
CREATE INDEX IF NOT EXISTS idx_global_insights_type ON global_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_correlations_customer ON insight_correlations(customer_id);
CREATE INDEX IF NOT EXISTS idx_department_insights_global ON department_insights(global_insight_id);