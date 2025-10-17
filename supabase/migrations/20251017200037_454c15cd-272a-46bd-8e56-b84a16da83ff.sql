-- Add documentation_url column for vendor docs link
ALTER TABLE public.documentation_vendors
ADD COLUMN IF NOT EXISTS documentation_url text;