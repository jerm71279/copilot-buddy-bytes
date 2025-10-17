-- Add database-level null byte protection for knowledge_articles
CREATE OR REPLACE FUNCTION reject_null_bytes_knowledge_articles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check text fields for null bytes
  IF NEW.title ~ E'\\x00' THEN
    RAISE EXCEPTION 'Null bytes detected in title field';
  END IF;
  
  IF NEW.content ~ E'\\x00' THEN
    RAISE EXCEPTION 'Null bytes detected in content field';
  END IF;
  
  -- Check UUID fields (they're stored as text in PG)
  IF NEW.customer_id::text ~ E'\\x00' THEN
    RAISE EXCEPTION 'Null bytes detected in customer_id';
  END IF;
  
  IF NEW.vendor_id IS NOT NULL AND NEW.vendor_id::text ~ E'\\x00' THEN
    RAISE EXCEPTION 'Null bytes detected in vendor_id';
  END IF;
  
  IF NEW.created_by IS NOT NULL AND NEW.created_by::text ~ E'\\x00' THEN
    RAISE EXCEPTION 'Null bytes detected in created_by';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run before INSERT or UPDATE
DROP TRIGGER IF EXISTS check_null_bytes_before_insert ON knowledge_articles;
CREATE TRIGGER check_null_bytes_before_insert
  BEFORE INSERT OR UPDATE ON knowledge_articles
  FOR EACH ROW 
  EXECUTE FUNCTION reject_null_bytes_knowledge_articles();