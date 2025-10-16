BEGIN;

-- Harden profile creation to eliminate control chars and add robust fallback
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_full_name text;
  admin_role_id uuid;
  admin_emails text[] := ARRAY['admin@admin.com', 'jerm712@icloud.com'];
BEGIN
  -- Build name from metadata/email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    'User'
  );

  -- Strip ALL control chars including nulls, trim, and cap length
  user_full_name := REGEXP_REPLACE(user_full_name, '[\x00-\x1F\x7F]', '', 'g');
  user_full_name := TRIM(user_full_name);
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := 'User';
  END IF;
  user_full_name := SUBSTRING(user_full_name FOR 200);

  -- Insert user profile (idempotent)
  INSERT INTO public.user_profiles (
    user_id, full_name, department, customer_id, created_at, updated_at
  ) VALUES (
    NEW.id, user_full_name, NULL, NULL, now(), now()
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Optional admin role assignment for whitelisted emails
  IF NEW.email = ANY(admin_emails) THEN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Super Admin' LIMIT 1;
    IF admin_role_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role_id)
      VALUES (NEW.id, admin_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;

EXCEPTION WHEN others THEN
  -- Fallback: ensure profile exists with safe minimal name, never block signup
  BEGIN
    INSERT INTO public.user_profiles (
      user_id, full_name, department, customer_id, created_at, updated_at
    ) VALUES (
      NEW.id,
      SUBSTRING(COALESCE(NEW.email, 'User') FOR 200),
      NULL, NULL, now(), now()
    ) ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  END;
END;
$$;

COMMIT;