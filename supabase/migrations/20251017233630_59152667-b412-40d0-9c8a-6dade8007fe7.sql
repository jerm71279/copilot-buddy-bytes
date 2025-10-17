-- Drop the trigger that checks for null bytes (with correct trigger name)
DROP TRIGGER IF EXISTS check_null_bytes_before_insert ON knowledge_articles;

-- Drop the function
DROP FUNCTION IF EXISTS public.reject_null_bytes_knowledge_articles();