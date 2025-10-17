-- Add vendor_id to knowledge_articles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_articles' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE public.knowledge_articles
    ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_knowledge_articles_vendor_id ON public.knowledge_articles(vendor_id);
  END IF;
END $$;