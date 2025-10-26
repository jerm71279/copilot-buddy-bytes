-- Probe all frameworks by attempting initialization and cleaning up afterwards
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
    SELECT id, COALESCE(framework_name, framework_code) AS name
    FROM public.compliance_frameworks
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

      framework_id := fw.id;
      framework_name := fw.name;
      status := 'ok';
      error := NULL;
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

      framework_id := fw.id;
      framework_name := fw.name;
      status := 'error';
      error := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$function$;