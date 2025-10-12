-- Create prompt templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'analysis', 'writing', 'coding', 'strategy', etc.
  department TEXT, -- null means available to all
  role_level TEXT, -- 'admin', 'user', null means available to all
  prompt_template TEXT NOT NULL,
  description TEXT,
  example_usage TEXT,
  tags TEXT[] DEFAULT '{}',
  context_hints JSONB DEFAULT '{}', -- hints for what context to inject
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view templates for their role"
  ON prompt_templates FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
    AND is_active = true
    AND (
      role_level IS NULL 
      OR role_level IN (
        SELECT r.name FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage templates"
  ON prompt_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create prompt usage tracking table
CREATE TABLE IF NOT EXISTS prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES prompt_templates(id),
  prompt_text TEXT NOT NULL,
  context_injected JSONB DEFAULT '{}',
  was_effective BOOLEAN,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prompt_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON prompt_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert usage"
  ON prompt_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their feedback"
  ON prompt_usage FOR UPDATE
  USING (user_id = auth.uid());

-- Create function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE prompt_templates
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = template_id_param;
END;
$$;

-- Insert starter prompt templates
INSERT INTO prompt_templates (customer_id, template_name, category, prompt_template, description, example_usage, tags, context_hints) VALUES
(
  (SELECT customer_id FROM user_profiles LIMIT 1),
  'Analyze Data Trends',
  'analysis',
  'Analyze the following data and identify key trends, patterns, and actionable insights. Focus on: {focus_areas}. Consider timeframe: {timeframe}.',
  'Perfect for analyzing metrics, KPIs, or business data to extract meaningful insights',
  'Use when you need to understand what your data is telling you',
  ARRAY['analysis', 'data', 'trends'],
  '{"inject": ["recent_metrics", "department_kpis", "timeframe"]}'::jsonb
),
(
  (SELECT customer_id FROM user_profiles LIMIT 1),
  'Root Cause Analysis',
  'analysis',
  'Perform a root cause analysis on: {problem_description}. Consider these factors: {relevant_factors}. Use the 5 Whys method and provide actionable recommendations.',
  'Helps identify underlying causes of issues or incidents',
  'Use when troubleshooting problems or investigating incidents',
  ARRAY['analysis', 'troubleshooting', 'incidents'],
  '{"inject": ["related_incidents", "system_logs", "recent_changes"]}'::jsonb
),
(
  (SELECT customer_id FROM user_profiles LIMIT 1),
  'Strategic Planning',
  'strategy',
  'Help me create a strategic plan for: {objective}. Consider our constraints: {constraints}, available resources: {resources}, and desired timeline: {timeline}. Provide a phased approach with milestones.',
  'For developing strategic plans and roadmaps',
  'Use when planning projects, initiatives, or organizational changes',
  ARRAY['strategy', 'planning', 'roadmap'],
  '{"inject": ["department_goals", "available_budget", "team_capacity"]}'::jsonb
),
(
  (SELECT customer_id FROM user_profiles LIMIT 1),
  'Risk Assessment',
  'analysis',
  'Assess the risks associated with: {scenario}. Identify potential risks, rate their likelihood and impact, and suggest mitigation strategies. Consider both technical and business risks.',
  'Systematic risk evaluation for changes or decisions',
  'Use before making major changes or decisions',
  ARRAY['risk', 'assessment', 'compliance'],
  '{"inject": ["related_changes", "compliance_requirements", "past_incidents"]}'::jsonb
),
(
  (SELECT customer_id FROM user_profiles LIMIT 1),
  'Customer Communication',
  'writing',
  'Draft a customer communication about: {topic}. Tone should be: {tone}. Include: {key_points}. Ensure clarity, professionalism, and appropriate urgency level.',
  'For composing customer-facing communications',
  'Use when communicating with clients about updates, issues, or changes',
  ARRAY['communication', 'customer', 'writing'],
  '{"inject": ["customer_history", "open_tickets", "sla_status"]}'::jsonb
),
(
  (SELECT customer_id FROM user_profiles LIMIT 1),
  'Process Optimization',
  'strategy',
  'Review this process and suggest optimizations: {process_description}. Focus on: reducing time, improving quality, reducing costs, enhancing user experience. Provide specific, actionable recommendations.',
  'Identifies ways to improve existing workflows and processes',
  'Use when looking to streamline operations',
  ARRAY['optimization', 'efficiency', 'process'],
  '{"inject": ["workflow_metrics", "bottlenecks", "user_feedback"]}'::jsonb
),
(
  (SELECT customer_id FROM user_profiles LIMIT 1),
  'Decision Matrix',
  'analysis',
  'Help me evaluate these options: {options}. Criteria to consider: {criteria}. Weight each criterion by importance and provide a decision matrix with recommendations.',
  'Structured approach to comparing and evaluating options',
  'Use when choosing between multiple alternatives',
  ARRAY['decision', 'analysis', 'comparison'],
  '{"inject": ["budget_constraints", "timeline", "stakeholder_priorities"]}'::jsonb
),
(
  (SELECT customer_id FROM user_profiles LIMIT 1),
  'Knowledge Documentation',
  'writing',
  'Create comprehensive documentation for: {topic}. Include: overview, step-by-step instructions, common issues and solutions, best practices. Target audience: {audience}.',
  'For creating clear, useful documentation',
  'Use when documenting processes, systems, or procedures',
  ARRAY['documentation', 'knowledge', 'training'],
  '{"inject": ["existing_docs", "common_issues", "user_feedback"]}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_prompt_templates_customer ON prompt_templates(customer_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_department ON prompt_templates(department);
CREATE INDEX idx_prompt_usage_user ON prompt_usage(user_id);
CREATE INDEX idx_prompt_usage_template ON prompt_usage(template_id);