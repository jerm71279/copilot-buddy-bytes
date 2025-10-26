-- Fix probe function: disambiguate framework_name column reference
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
    SELECT id, COALESCE(cf.framework_name, cf.framework_code) AS name
    FROM public.compliance_frameworks cf
    WHERE is_active = true
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

      fw_id := fw.id;
      fw_name := fw.name;
      result_status := 'ok';
      result_error := NULL;
      
      framework_id := fw_id;
      framework_name := fw_name;
      status := result_status;
      error := result_error;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      -- Capture error and still cleanup partial inserts
      DELETE FROM public.compliance_roadmap_milestones
      WHERE stage_id IN (
        SELECT id FROM public.compliance_roadmap_stages
        WHERE framework_id = fw.id AND customer_id = _customer_id
      );
      DELETE FROM public.compliance_roadmap_stages
      WHERE framework_id = fw.id AND customer_id = _customer_id;

      fw_id := fw.id;
      fw_name := fw.name;
      result_status := 'error';
      result_error := SQLERRM;
      
      framework_id := fw_id;
      framework_name := fw_name;
      status := result_status;
      error := result_error;
      RETURN NEXT;
    END;
  END LOOP;
END;
$function$;