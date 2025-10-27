-- Add search_path to clean_expired_cache function for security
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.ai_prompt_cache WHERE expires_at < now();
END;
$function$;