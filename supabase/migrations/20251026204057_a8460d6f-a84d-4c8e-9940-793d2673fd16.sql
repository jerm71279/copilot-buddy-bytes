-- Fix probe function properly: use RETURN QUERY for cleaner output
DROP FUNCTION IF EXISTS public.probe_framework_initialization(uuid);

CREATE OR REPLACE FUNCTION public.probe_framework_initialization(_customer_id uuid)
RETURNS TABLE(
  framework_id uuid,
  framework_name text,
  status text,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fw RECORD;
  first_id uuid;
  fw_id uuid;
  fw_name text;
  result_status text;
  result_error text;
BEGIN
  FOR fw IN 
    SELECT cf.id, COALESCE(cf.framework_name, cf.framework_code) AS name
    FROM public.compliance_frameworks cf
    WHERE cf.is_active = true
    ORDER BY name
  LOOP
    BEGIN
      -- Try initialize (uses safe initializer now)
      first_id := public.initialize_compliance_roadmap(fw.id, _customer_id);

      -- Cleanup any created data for this probe run
      DELETE FROM public.compliance_roadmap_milestones
      WHERE stage_id IN (
        SELECT id FROM public.compliance_roadmap_stages
        WHERE framework_id = fw.id AND customer_id = _customer_id
      );
      DELETE FROM public.compliance_roadmap_stages
      WHERE framework_id = fw.id AND customer_id = _customer_id;

      -- Return success row using RETURN QUERY
      RETURN QUERY SELECT fw.id, fw.name, 'ok'::text, NULL::text;
      
    EXCEPTION WHEN OTHERS THEN
      -- Capture error and still cleanup partial inserts
      DELETE FROM public.compliance_roadmap_milestones
      WHERE stage_id IN (
        SELECT id FROM public.compliance_roadmap_stages
        WHERE framework_id = fw.id AND customer_id = _customer_id
      );
      DELETE FROM public.compliance_roadmap_stages
      WHERE framework_id = fw.id AND customer_id = _customer_id;

      -- Return error row using RETURN QUERY
      RETURN QUERY SELECT fw.id, fw.name, 'error'::text, SQLERRM::text;
    END;
  END LOOP;
  
  RETURN;
END;
$function$;