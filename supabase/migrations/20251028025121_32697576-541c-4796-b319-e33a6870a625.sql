
-- Fix validate_text_input to properly handle null byte checking
CREATE OR REPLACE FUNCTION public.validate_text_input(input_text text, max_length integer DEFAULT 1000, field_name text DEFAULT 'field'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check null
  IF input_text IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check length
  IF LENGTH(input_text) > max_length THEN
    RAISE EXCEPTION '% exceeds maximum length of % characters', field_name, max_length;
  END IF;

  -- Check for null bytes using CHR(0) 
  IF POSITION(CHR(0) IN input_text) > 0 THEN
    RAISE EXCEPTION '% contains null bytes which are not allowed', field_name;
  END IF;

  -- Check for obvious SQL injection patterns
  IF input_text ~* '(DROP|DELETE|INSERT|UPDATE).*(TABLE|FROM|INTO)|UNION.*SELECT' THEN
    RAISE EXCEPTION '% contains suspicious SQL patterns', field_name;
  END IF;

  -- Check for script tags (basic XSS prevention)
  IF input_text ~* '<script|<iframe|javascript:' THEN
    RAISE EXCEPTION '% contains potentially malicious code', field_name;
  END IF;

  RETURN TRUE;
END;
$function$;
