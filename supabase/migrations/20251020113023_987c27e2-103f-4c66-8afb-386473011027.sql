-- Add department and approval fields to knowledge_insights
ALTER TABLE knowledge_insights 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS relevance_score numeric,
ADD COLUMN IF NOT EXISTS reviewed_notes text,
ADD COLUMN IF NOT EXISTS auto_approved boolean DEFAULT false;

-- Create index for department-based queries
CREATE INDEX IF NOT EXISTS idx_knowledge_insights_department 
ON knowledge_insights(department, status);

CREATE INDEX IF NOT EXISTS idx_knowledge_insights_relevance 
ON knowledge_insights(relevance_score DESC, created_at DESC);

-- Add check constraint for relevance score
ALTER TABLE knowledge_insights 
ADD CONSTRAINT check_relevance_score 
CHECK (relevance_score >= 0 AND relevance_score <= 1);

-- Update existing insights to have a default relevance score
UPDATE knowledge_insights 
SET relevance_score = confidence_score 
WHERE relevance_score IS NULL AND confidence_score IS NOT NULL;