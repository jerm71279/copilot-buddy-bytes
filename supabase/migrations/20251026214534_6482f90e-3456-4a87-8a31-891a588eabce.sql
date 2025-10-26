-- Fix the trigger - remove buggy OLD reference and simplify
CREATE OR REPLACE FUNCTION public.prevent_null_bytes_frameworks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Strip null bytes from all text fields on INSERT/UPDATE
  NEW.framework_code := REPLACE(NEW.framework_code, CHR(0), '');
  NEW.framework_name := REPLACE(NEW.framework_name, CHR(0), '');
  IF NEW.description IS NOT NULL THEN
    NEW.description := REPLACE(NEW.description, CHR(0), '');
  END IF;
  IF NEW.industry IS NOT NULL THEN
    NEW.industry := REPLACE(NEW.industry, CHR(0), '');
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS prevent_null_bytes_frameworks_trigger ON public.compliance_frameworks;
CREATE TRIGGER prevent_null_bytes_frameworks_trigger
  BEFORE INSERT OR UPDATE ON public.compliance_frameworks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_null_bytes_frameworks();