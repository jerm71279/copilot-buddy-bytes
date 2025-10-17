-- Fix AI Insight Tables Schema Mismatches
-- Issue: central-mml-processor edge function and database schema are out of sync

-- 1. Fix global_insights table
ALTER TABLE global_insights 
  ADD COLUMN IF NOT EXISTS insight_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_insight_count INTEGER DEFAULT 0;

-- Change recommended_actions from JSONB to TEXT[]
-- First, migrate existing data
UPDATE global_insights
SET insight_data = jsonb_build_object(
  'title', title,
  'description', description,
  'recommended_actions', recommended_actions
)
WHERE insight_data = '{}';

-- Now we can work with recommended_actions separately
-- Convert JSONB array to TEXT array
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'global_insights' 
    AND column_name = 'recommended_actions' 
    AND data_type = 'jsonb'
  ) THEN
    -- Create temp column
    ALTER TABLE global_insights ADD COLUMN recommended_actions_temp TEXT[];
    
    -- Migrate data (extract JSONB array to TEXT array)
    UPDATE global_insights
    SET recommended_actions_temp = ARRAY(
      SELECT jsonb_array_elements_text(recommended_actions)
    )
    WHERE recommended_actions IS NOT NULL AND recommended_actions != 'null'::jsonb;
    
    -- Drop old column and rename new one
    ALTER TABLE global_insights DROP COLUMN recommended_actions;
    ALTER TABLE global_insights RENAME COLUMN recommended_actions_temp TO recommended_actions;
  END IF;
END $$;

COMMENT ON COLUMN global_insights.insight_data IS 'Consolidated insight data including themes, categories, and metadata';
COMMENT ON COLUMN global_insights.source_insight_count IS 'Number of department insights that contributed to this global insight';

-- 2. Fix insight_correlations table
-- Rename columns to match edge function expectations
ALTER TABLE insight_correlations 
  RENAME COLUMN insight_a_id TO department_insight_1_id;

ALTER TABLE insight_correlations 
  RENAME COLUMN insight_b_id TO department_insight_2_id;

-- Add global_insight_id reference
ALTER TABLE insight_correlations 
  ADD COLUMN IF NOT EXISTS global_insight_id UUID REFERENCES global_insights(id) ON DELETE CASCADE;

-- Rename description to be more specific
ALTER TABLE insight_correlations 
  RENAME COLUMN description TO relationship_description;

-- Add index on new foreign key
CREATE INDEX IF NOT EXISTS idx_insight_correlations_global ON insight_correlations(global_insight_id);

COMMENT ON COLUMN insight_correlations.global_insight_id IS 'Reference to the global insight that identified this correlation';
COMMENT ON COLUMN insight_correlations.relationship_description IS 'Description of how these insights are related';

-- 3. Fix department_insights table
ALTER TABLE department_insights 
  ADD COLUMN IF NOT EXISTS insight_data JSONB DEFAULT '{}';

-- Migrate existing data into insight_data
UPDATE department_insights
SET insight_data = jsonb_build_object(
  'title', title,
  'description', description,
  'impact_score', impact_score,
  'affected_users', affected_users,
  'frequency_count', frequency_count,
  'metadata', metadata
)
WHERE insight_data = '{}';

COMMENT ON COLUMN department_insights.insight_data IS 'Consolidated insight data with themes, keywords, and categories for Layer 2 processing';

-- 4. Update indexes for new columns
CREATE INDEX IF NOT EXISTS idx_department_insights_data ON department_insights USING GIN (insight_data);
CREATE INDEX IF NOT EXISTS idx_global_insights_data ON global_insights USING GIN (insight_data);

-- 5. Add helpful view for monitoring data flow (fixed query)
CREATE OR REPLACE VIEW insight_data_flow AS
WITH dept_stats AS (
  SELECT 
    'Layer 1' as layer,
    COUNT(*) as insight_count,
    COUNT(DISTINCT customer_id) as customer_count,
    COUNT(DISTINCT department) as department_count
  FROM department_insights
),
global_stats AS (
  SELECT 
    'Layer 2' as layer,
    COUNT(*) as insight_count,
    COUNT(DISTINCT customer_id) as customer_count,
    COUNT(DISTINCT dept) as department_count
  FROM global_insights, unnest(affected_departments) as dept
)
SELECT * FROM dept_stats
UNION ALL
SELECT * FROM global_stats;

COMMENT ON VIEW insight_data_flow IS 'Monitor the flow of insights through the 3-tier AI architecture';
