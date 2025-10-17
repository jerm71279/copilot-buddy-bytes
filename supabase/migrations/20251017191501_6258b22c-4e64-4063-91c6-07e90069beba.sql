-- Rename our documentation vendors table to avoid conflict with existing vendors table
ALTER TABLE IF EXISTS public.vendors RENAME TO documentation_vendors;

-- Update foreign key reference in knowledge_articles
ALTER TABLE public.knowledge_articles 
  DROP CONSTRAINT IF EXISTS knowledge_articles_vendor_id_fkey;

ALTER TABLE public.knowledge_articles 
  ADD CONSTRAINT knowledge_articles_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES public.documentation_vendors(id) ON DELETE SET NULL;