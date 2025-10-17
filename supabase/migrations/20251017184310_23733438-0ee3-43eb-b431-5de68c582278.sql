-- Create signup trigger to auto-handle future users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
  END IF;
END $$;

-- Backfill only the role assignment for the existing admin user (skip profiles to avoid validation triggers)
DO $$
DECLARE
  v_user_id uuid;
  v_role_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'security.admin@oberaconnect.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'Super Admin' LIMIT 1;
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (v_user_id, v_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    ELSE
      RAISE NOTICE 'Super Admin role not found; please seed roles table.';
    END IF;
  END IF;
END $$;