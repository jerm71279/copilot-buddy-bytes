-- Phase 2: Insight Aggregation Tables
-- Department-level insights generated from user interactions
CREATE TABLE department_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  department TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'bottleneck', 'opportunity', 'risk', 'knowledge_gap')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  supporting_interactions UUID[],
  affected_users INTEGER DEFAULT 0,
  frequency_count INTEGER DEFAULT 1,
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_detected_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'acted_upon', 'dismissed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which insights have been promoted to knowledge articles
CREATE TABLE insight_to_article (
  insight_id UUID REFERENCES department_insights(id) ON DELETE CASCADE,
  article_id UUID REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  promoted_by UUID,
  PRIMARY KEY (insight_id, article_id)
);

-- Enable RLS
ALTER TABLE department_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_to_article ENABLE ROW LEVEL SECURITY;

-- RLS Policies for department_insights
CREATE POLICY "Users can view insights in their organization"
  ON department_insights FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert insights"
  ON department_insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update insights"
  ON department_insights FOR UPDATE
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for insight_to_article
CREATE POLICY "Users can view insight-article links"
  ON insight_to_article FOR SELECT
  USING (
    insight_id IN (
      SELECT id FROM department_insights 
      WHERE customer_id IN (
        SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage insight-article links"
  ON insight_to_article FOR ALL
  USING (
    insight_id IN (
      SELECT id FROM department_insights 
      WHERE customer_id IN (
        SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes for performance
CREATE INDEX idx_department_insights_customer_dept ON department_insights(customer_id, department);
CREATE INDEX idx_department_insights_status ON department_insights(status);
CREATE INDEX idx_department_insights_created ON department_insights(created_at DESC);

-- Trigger for updating updated_at
CREATE TRIGGER update_department_insights_updated_at
  BEFORE UPDATE ON department_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();