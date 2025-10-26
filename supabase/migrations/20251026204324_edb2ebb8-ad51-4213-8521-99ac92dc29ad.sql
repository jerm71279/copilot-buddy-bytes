-- Fix framework_id ambiguity in probe function
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
BEGIN
  FOR fw IN 
    SELECT cf.id AS fw_id, COALESCE(cf.framework_name, cf.framework_code) AS fw_name
    FROM public.compliance_frameworks cf
    WHERE cf.is_active = true
    ORDER BY fw_name
  LOOP
    BEGIN
      -- Try initialize (uses safe initializer now)
      first_id := public.initialize_compliance_roadmap(fw.fw_id, _customer_id);

      -- Cleanup any created data for this probe run
      DELETE FROM public.compliance_roadmap_milestones
      WHERE stage_id IN (
        SELECT id FROM public.compliance_roadmap_stages
        WHERE compliance_roadmap_stages.framework_id = fw.fw_id 
          AND customer_id = _customer_id
      );
      DELETE FROM public.compliance_roadmap_stages
      WHERE compliance_roadmap_stages.framework_id = fw.fw_id 
        AND customer_id = _customer_id;

      -- Return success row
      framework_id := fw.fw_id;
      framework_name := fw.fw_name;
      status := 'ok';
      error := NULL;
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Capture error and cleanup
      DELETE FROM public.compliance_roadmap_milestones
      WHERE stage_id IN (
        SELECT id FROM public.compliance_roadmap_stages
        WHERE compliance_roadmap_stages.framework_id = fw.fw_id 
          AND customer_id = _customer_id
      );
      DELETE FROM public.compliance_roadmap_stages
      WHERE compliance_roadmap_stages.framework_id = fw.fw_id 
        AND customer_id = _customer_id;

      -- Return error row
      framework_id := fw.fw_id;
      framework_name := fw.fw_name;
      status := 'error';
      error := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$function$;