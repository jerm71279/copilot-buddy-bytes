-- Drop the validation trigger that's still checking for null bytes
DROP TRIGGER IF EXISTS validate_knowledge_article_trigger ON knowledge_articles;

-- Also drop the validate_knowledge_article function
DROP FUNCTION IF EXISTS public.validate_knowledge_article();