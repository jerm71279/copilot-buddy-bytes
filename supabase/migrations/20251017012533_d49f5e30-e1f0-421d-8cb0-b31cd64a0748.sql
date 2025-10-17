-- AI Patterns System (Fabric-style)

-- Pattern definitions table
CREATE TABLE IF NOT EXISTS ai_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  pattern_slug TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  input_placeholder TEXT DEFAULT 'Enter your text here...',
  output_format TEXT DEFAULT 'markdown',
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_system_pattern BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, pattern_slug)
);

-- Pattern execution logs
CREATE TABLE IF NOT EXISTS ai_pattern_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES ai_patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  department TEXT,
  input_text TEXT NOT NULL,
  output_text TEXT,
  execution_time_ms INTEGER,
  model_used TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pattern chains (combine multiple patterns)
CREATE TABLE IF NOT EXISTS ai_pattern_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  chain_name TEXT NOT NULL,
  description TEXT,
  pattern_sequence UUID[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_patterns_customer ON ai_patterns(customer_id);
CREATE INDEX idx_ai_patterns_category ON ai_patterns(category);
CREATE INDEX idx_ai_patterns_active ON ai_patterns(is_active);
CREATE INDEX idx_ai_pattern_executions_customer ON ai_pattern_executions(customer_id);
CREATE INDEX idx_ai_pattern_executions_pattern ON ai_pattern_executions(pattern_id);
CREATE INDEX idx_ai_pattern_executions_user ON ai_pattern_executions(user_id);
CREATE INDEX idx_ai_pattern_executions_created ON ai_pattern_executions(created_at);

-- RLS Policies
ALTER TABLE ai_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pattern_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pattern_chains ENABLE ROW LEVEL SECURITY;

-- Users can view patterns for their customer
CREATE POLICY "Users can view their customer patterns"
  ON ai_patterns FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
    OR is_system_pattern = true
  );

-- Users can create patterns for their customer
CREATE POLICY "Users can create patterns"
  ON ai_patterns FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update their own patterns
CREATE POLICY "Users can update own patterns"
  ON ai_patterns FOR UPDATE
  USING (
    created_by = auth.uid()
    OR customer_id IN (
      SELECT customer_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_id IN (SELECT user_id FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name IN ('Super Admin', 'Admin')))
    )
  );

-- Users can view their execution history
CREATE POLICY "Users can view their executions"
  ON ai_pattern_executions FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Users can create execution logs
CREATE POLICY "Users can create execution logs"
  ON ai_pattern_executions FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Pattern chains policies
CREATE POLICY "Users can view their customer chains"
  ON ai_pattern_chains FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chains"
  ON ai_pattern_chains FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Trigger to update usage count
CREATE OR REPLACE FUNCTION increment_pattern_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_patterns
  SET usage_count = usage_count + 1,
      avg_execution_time_ms = COALESCE(
        (avg_execution_time_ms * usage_count + NEW.execution_time_ms) / (usage_count + 1),
        NEW.execution_time_ms
      )
  WHERE id = NEW.pattern_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_increment_pattern_usage
  AFTER INSERT ON ai_pattern_executions
  FOR EACH ROW
  EXECUTE FUNCTION increment_pattern_usage();

-- Insert system patterns (Fabric-style defaults)
INSERT INTO ai_patterns (pattern_name, pattern_slug, description, system_prompt, category, tags, is_system_pattern) VALUES
('Summarize', 'summarize', 'Create a concise summary of any text', 'You are a summarization expert. Create a clear, concise summary of the following text. Focus on key points and main ideas. Use bullet points for clarity.', 'Analysis', ARRAY['summary', 'analysis'], true),
('Extract Insights', 'extract-insights', 'Extract key insights and actionable items', 'You are an insight extraction expert. Analyze the text and extract: 1) Key insights, 2) Actionable items, 3) Important patterns or trends. Format as clear sections.', 'Analysis', ARRAY['insights', 'analysis'], true),
('Simplify', 'simplify', 'Explain complex concepts in simple terms', 'You are an expert at simplifying complex topics. Rewrite the following text in simple, clear language that anyone can understand. Use analogies where helpful.', 'Communication', ARRAY['simplify', 'explain'], true),
('Extract Action Items', 'extract-actions', 'Pull out all action items and tasks', 'You are a task extraction expert. Extract all action items, tasks, and to-dos from the text. Format as a numbered list with clear action verbs.', 'Productivity', ARRAY['tasks', 'actions'], true),
('Analyze Sentiment', 'sentiment', 'Determine sentiment and tone', 'You are a sentiment analysis expert. Analyze the sentiment and tone of the text. Provide: 1) Overall sentiment (positive/negative/neutral), 2) Key emotional themes, 3) Tone assessment.', 'Analysis', ARRAY['sentiment', 'analysis'], true),
('Create FAQ', 'create-faq', 'Generate FAQ from content', 'You are an FAQ generation expert. Create a comprehensive FAQ based on the content. Format as Q&A pairs covering the most important topics.', 'Documentation', ARRAY['faq', 'documentation'], true),
('Technical Documentation', 'tech-docs', 'Convert to technical documentation', 'You are a technical writing expert. Convert the input into clear technical documentation with: 1) Overview, 2) Key concepts, 3) Step-by-step instructions, 4) Best practices.', 'Documentation', ARRAY['documentation', 'technical'], true),
('Risk Analysis', 'risk-analysis', 'Identify potential risks and issues', 'You are a risk analysis expert. Identify potential risks, issues, and concerns from the text. Categorize by severity (high/medium/low) and provide mitigation suggestions.', 'Analysis', ARRAY['risk', 'analysis'], true),
('Meeting Notes', 'meeting-notes', 'Structure raw notes into organized format', 'You are a meeting notes expert. Structure the raw notes into: 1) Attendees, 2) Key discussion points, 3) Decisions made, 4) Action items with owners, 5) Next steps.', 'Productivity', ARRAY['meetings', 'notes'], true),
('Compliance Check', 'compliance-check', 'Check for compliance issues', 'You are a compliance expert. Review the text for potential compliance issues related to data privacy, security, regulatory requirements. Highlight concerns and suggest corrections.', 'Compliance', ARRAY['compliance', 'security'], true);

-- Update timestamp trigger
CREATE TRIGGER update_ai_patterns_updated_at
  BEFORE UPDATE ON ai_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();