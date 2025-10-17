-- Expand allowed values for knowledge_articles.source_type to include 'vendor_documentation'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name = 'knowledge_articles' 
      AND constraint_name = 'knowledge_articles_source_type_check'
  ) THEN
    ALTER TABLE public.knowledge_articles 
      DROP CONSTRAINT knowledge_articles_source_type_check;
  END IF;

  -- Recreate the check constraint with the extended set
  ALTER TABLE public.knowledge_articles 
    ADD CONSTRAINT knowledge_articles_source_type_check 
    CHECK (source_type IS NULL OR source_type IN ('manual', 'ai_generated', 'file_import', 'workflow_insight', 'vendor_documentation'));
END $$;

-- Note: No data changes needed; existing rows already satisfy the new constraint.