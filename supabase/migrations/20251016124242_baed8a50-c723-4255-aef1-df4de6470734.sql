-- Fix null character issue in handle_new_user_profile trigger using CHR function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_full_name text;
  admin_role_id uuid;
  admin_emails text[] := ARRAY['admin@admin.com', 'jerm712@icloud.com'];
BEGIN
  -- Extract user information from metadata (works for both email and OAuth)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- Remove null bytes and trim whitespace
  user_full_name := REPLACE(user_full_name, CHR(0), '');
  user_full_name := TRIM(user_full_name);

  -- Insert user profile
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    department,
    customer_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_full_name,
    NULL,
    NULL,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Handle admin role assignment
  IF NEW.email = ANY(admin_emails) THEN
    SELECT id INTO admin_role_id
    FROM roles
    WHERE name = 'Super Admin'
    LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role_id)
      VALUES (NEW.id, admin_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;