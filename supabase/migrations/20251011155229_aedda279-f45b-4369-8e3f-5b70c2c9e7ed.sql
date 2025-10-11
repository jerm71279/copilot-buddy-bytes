-- Add input validation constraints and functions

-- Function to validate string length and dangerous patterns
CREATE OR REPLACE FUNCTION validate_text_input(
  input_text TEXT,
  max_length INTEGER DEFAULT 1000,
  field_name TEXT DEFAULT 'field'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check null
  IF input_text IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check length
  IF LENGTH(input_text) > max_length THEN
    RAISE EXCEPTION '% exceeds maximum length of % characters', field_name, max_length;
  END IF;

  -- Check for null bytes
  IF input_text ~ E'\\x00' OR input_text LIKE '%' || CHR(0) || '%' THEN
    RAISE EXCEPTION '% contains null bytes which are not allowed', field_name;
  END IF;

  -- Check for obvious SQL injection patterns
  IF input_text ~* E'(DROP|DELETE|INSERT|UPDATE).*(TABLE|FROM|INTO)|UNION.*SELECT|.*;.*--|''.*OR.*''.*''.*=' THEN
    RAISE EXCEPTION '% contains suspicious SQL patterns', field_name;
  END IF;

  -- Check for script tags (basic XSS prevention)
  IF input_text ~* E'<script|<iframe|javascript:|on\\w+\\s*=' THEN
    RAISE EXCEPTION '% contains potentially malicious code', field_name;
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to validate array inputs
CREATE OR REPLACE FUNCTION validate_array_input(
  input_array TEXT[],
  max_items INTEGER DEFAULT 100,
  max_item_length INTEGER DEFAULT 255,
  field_name TEXT DEFAULT 'array field'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item TEXT;
BEGIN
  -- Check null
  IF input_array IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check array length
  IF array_length(input_array, 1) > max_items THEN
    RAISE EXCEPTION '% exceeds maximum of % items', field_name, max_items;
  END IF;

  -- Validate each item
  FOREACH item IN ARRAY input_array
  LOOP
    IF LENGTH(item) > max_item_length THEN
      RAISE EXCEPTION 'Item in % exceeds maximum length of % characters', field_name, max_item_length;
    END IF;
    
    IF item ~* E'<script|<iframe|javascript:|on\\w+\\s*=' THEN
      RAISE EXCEPTION 'Item in % contains potentially malicious code', field_name;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- Add validation triggers for knowledge_articles
CREATE OR REPLACE FUNCTION validate_knowledge_article()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate title
  PERFORM validate_text_input(NEW.title, 200, 'title');
  
  -- Validate content
  PERFORM validate_text_input(NEW.content, 50000, 'content');
  
  -- Validate tags array
  IF NEW.tags IS NOT NULL THEN
    PERFORM validate_array_input(NEW.tags, 20, 50, 'tags');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_knowledge_article_trigger ON knowledge_articles;
CREATE TRIGGER validate_knowledge_article_trigger
  BEFORE INSERT OR UPDATE ON knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION validate_knowledge_article();

-- Add validation triggers for evidence_files
CREATE OR REPLACE FUNCTION validate_evidence_file()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate file_name
  IF NEW.file_name ~ '\.\.[/\\]' THEN
    RAISE EXCEPTION 'file_name contains path traversal sequences';
  END IF;
  
  PERFORM validate_text_input(NEW.file_name, 255, 'file_name');
  
  -- Validate description
  IF NEW.description IS NOT NULL THEN
    PERFORM validate_text_input(NEW.description, 2000, 'description');
  END IF;
  
  -- Validate compliance_tags
  IF NEW.compliance_tags IS NOT NULL THEN
    PERFORM validate_array_input(NEW.compliance_tags, 20, 50, 'compliance_tags');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_evidence_file_trigger ON evidence_files;
CREATE TRIGGER validate_evidence_file_trigger
  BEFORE INSERT OR UPDATE ON evidence_files
  FOR EACH ROW
  EXECUTE FUNCTION validate_evidence_file();

-- Add validation triggers for workflows
CREATE OR REPLACE FUNCTION validate_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate workflow_name
  PERFORM validate_text_input(NEW.workflow_name, 200, 'workflow_name');
  
  -- Validate description
  IF NEW.description IS NOT NULL THEN
    PERFORM validate_text_input(NEW.description, 2000, 'description');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_workflow_trigger ON workflows;
CREATE TRIGGER validate_workflow_trigger
  BEFORE INSERT OR UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION validate_workflow();

-- Add validation triggers for audit_logs
CREATE OR REPLACE FUNCTION validate_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate system_name
  PERFORM validate_text_input(NEW.system_name, 100, 'system_name');
  
  -- Validate action_type
  PERFORM validate_text_input(NEW.action_type, 100, 'action_type');
  
  -- Validate compliance_tags
  IF NEW.compliance_tags IS NOT NULL THEN
    PERFORM validate_array_input(NEW.compliance_tags, 20, 50, 'compliance_tags');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_audit_log_trigger ON audit_logs;
CREATE TRIGGER validate_audit_log_trigger
  BEFORE INSERT OR UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION validate_audit_log();

-- Add validation triggers for user_profiles
CREATE OR REPLACE FUNCTION validate_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate full_name
  IF NEW.full_name IS NOT NULL THEN
    PERFORM validate_text_input(NEW.full_name, 200, 'full_name');
  END IF;
  
  -- Validate department
  IF NEW.department IS NOT NULL THEN
    PERFORM validate_text_input(NEW.department, 100, 'department');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_user_profile_trigger ON user_profiles;
CREATE TRIGGER validate_user_profile_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_profile();

COMMENT ON FUNCTION validate_text_input IS 'Validates text input for length and dangerous patterns (SQL injection, XSS)';
COMMENT ON FUNCTION validate_array_input IS 'Validates array inputs for size and content safety';
