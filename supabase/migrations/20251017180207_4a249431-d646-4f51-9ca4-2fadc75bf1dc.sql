
-- Update the handle_new_user_profile function to include security@oberaconnect.com in admin whitelist
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_full_name text;
  admin_role_id uuid;
  admin_emails text[] := ARRAY['admin@admin.com', 'jerm712@icloud.com', 'security@oberaconnect.com'];
  safe_email text;
BEGIN
  -- Safely extract and sanitize email first (as fallback)
  safe_email := COALESCE(NEW.email, 'user@example.com');
  safe_email := REGEXP_REPLACE(safe_email, '[\x00-\x1F\x7F]+', '', 'g');
  safe_email := TRIM(safe_email);
  
  -- Try to extract full_name from metadata, with aggressive sanitization
  BEGIN
    user_full_name := COALESCE(
      NULLIF(TRIM(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '[\x00-\x1F\x7F]+', '', 'g')), ''),
      NULLIF(TRIM(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', ''), '[\x00-\x1F\x7F]+', '', 'g')), ''),
      safe_email,
      'User'
    );
  EXCEPTION WHEN OTHERS THEN
    -- If metadata extraction fails for any reason, use safe fallback
    user_full_name := COALESCE(safe_email, 'User');
  END;
  
  -- Additional safety: strip any remaining problematic characters
  user_full_name := REGEXP_REPLACE(user_full_name, '[\x00-\x1F\x7F]+', '', 'g');
  user_full_name := TRIM(user_full_name);
  
  -- Final validation
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := 'User';
  END IF;
  
  -- Cap length
  user_full_name := SUBSTRING(user_full_name FOR 200);

  -- Insert user profile (idempotent) - wrapped in exception handler
  BEGIN
    INSERT INTO public.user_profiles (
      user_id, full_name, department, customer_id, created_at, updated_at
    ) VALUES (
      NEW.id, user_full_name, NULL, NULL, now(), now()
    ) ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Last resort: insert with absolute minimal safe data
    INSERT INTO public.user_profiles (
      user_id, full_name, department, customer_id, created_at, updated_at
    ) VALUES (
      NEW.id, 'User', NULL, NULL, now(), now()
    ) ON CONFLICT (user_id) DO NOTHING;
  END;

  -- Optional admin role assignment for whitelisted emails (now includes security@oberaconnect.com)
  IF safe_email = ANY(admin_emails) THEN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Super Admin' LIMIT 1;
    IF admin_role_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role_id)
      VALUES (NEW.id, admin_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Ultimate fallback: never block signup, just return NEW
  -- Log the error but allow auth to proceed
  RAISE WARNING 'Error in handle_new_user_profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;
