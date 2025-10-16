BEGIN;

-- Re-enable profile creation trigger after signup (sanitized function already exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_profile();

-- Allow users to create their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_profiles' AND policyname='Users can create their own profile'
  ) THEN
    CREATE POLICY "Users can create their own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Allow users to create and view their own customer row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customers' AND policyname='Authenticated users insert own customer'
  ) THEN
    CREATE POLICY "Authenticated users insert own customer"
    ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customers' AND policyname='Authenticated users view own customer (direct)'
  ) THEN
    CREATE POLICY "Authenticated users view own customer (direct)"
    ON public.customers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- Allow inserting customizations for the user's own customer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customer_customizations' AND policyname='Users insert customizations for own customer'
  ) THEN
    CREATE POLICY "Users insert customizations for own customer"
    ON public.customer_customizations
    FOR INSERT
    TO authenticated
    WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));
  END IF;
END$$;

COMMIT;