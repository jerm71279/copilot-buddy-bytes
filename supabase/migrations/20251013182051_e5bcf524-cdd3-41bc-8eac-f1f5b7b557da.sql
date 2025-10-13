-- Drop existing public policies on role_permissions
DROP POLICY IF EXISTS "Everyone can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Public can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;

-- Create admin-only SELECT policy (drop first if exists)
DROP POLICY IF EXISTS "Only admins can view role permissions" ON public.role_permissions;
CREATE POLICY "Only admins can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));