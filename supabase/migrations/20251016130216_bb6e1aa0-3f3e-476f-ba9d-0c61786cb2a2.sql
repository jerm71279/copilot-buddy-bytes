-- Temporarily disable problematic profile creation trigger to unblock signup
BEGIN;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
COMMIT;