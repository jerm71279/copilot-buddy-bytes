-- Fix trigger_cascade_framework to check if customer_id column exists
DROP TRIGGER IF EXISTS trigger_cascade_framework ON compliance_frameworks;

CREATE OR REPLACE FUNCTION public.trigger_cascade_framework()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only cascade if framework has a customer_id (for customer-specific frameworks)
  -- and that customer is an MSP, and framework is active
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    -- Check if this is a customer-specific framework by looking for customer_id in the row
    -- If no customer_id column or it's null, this is a global framework - don't cascade
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'compliance_frameworks' 
        AND column_name = 'customer_id'
    ) THEN
      -- Only proceed if customer_id is not null and customer is MSP
      IF NEW.customer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM customers 
        WHERE id = NEW.customer_id 
          AND customer_type = 'msp'
      ) THEN
        PERFORM cascade_framework_to_children(NEW.id, NEW.customer_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_cascade_framework
AFTER INSERT ON compliance_frameworks
FOR EACH ROW
EXECUTE FUNCTION public.trigger_cascade_framework();