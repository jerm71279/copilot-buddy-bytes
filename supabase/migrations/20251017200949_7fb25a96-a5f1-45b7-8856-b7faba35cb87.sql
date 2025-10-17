-- Update vendor_type check constraint to match UI values
ALTER TABLE public.documentation_vendors 
DROP CONSTRAINT IF EXISTS vendors_vendor_type_check;

ALTER TABLE public.documentation_vendors
ADD CONSTRAINT vendors_vendor_type_check 
CHECK (vendor_type = ANY (ARRAY['firewall'::text, 'network'::text, 'security'::text, 'software'::text, 'cloud'::text, 'hardware'::text, 'other'::text]));