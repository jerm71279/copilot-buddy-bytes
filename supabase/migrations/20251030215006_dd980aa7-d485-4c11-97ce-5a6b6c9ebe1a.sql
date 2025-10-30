-- SharePoint Documents Table
CREATE TABLE IF NOT EXISTS public.sharepoint_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  document_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  web_url TEXT NOT NULL,
  download_url TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  created_by TEXT,
  modified_by TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL,
  sharepoint_path TEXT,
  content_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, document_id)
);

-- SharePoint Sync Log
CREATE TABLE IF NOT EXISTS public.sharepoint_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'in_progress',
  documents_synced INTEGER DEFAULT 0,
  documents_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_config JSONB DEFAULT '{}'::jsonb
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_sharepoint_documents_search 
ON public.sharepoint_documents 
USING gin(to_tsvector('english', COALESCE(file_name, '') || ' ' || COALESCE(content_text, '')));

-- File type filter index
CREATE INDEX IF NOT EXISTS idx_sharepoint_documents_file_type 
ON public.sharepoint_documents(customer_id, file_type);

-- Modified date index for sorting
CREATE INDEX IF NOT EXISTS idx_sharepoint_documents_modified 
ON public.sharepoint_documents(customer_id, modified_at DESC);

-- Enable RLS
ALTER TABLE public.sharepoint_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharepoint_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sharepoint_documents
CREATE POLICY "Users can view their customer's SharePoint documents"
ON public.sharepoint_documents FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage SharePoint documents"
ON public.sharepoint_documents FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for sharepoint_sync_log
CREATE POLICY "Users can view their customer's sync logs"
ON public.sharepoint_sync_log FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage sync logs"
ON public.sharepoint_sync_log FOR ALL
USING (true)
WITH CHECK (true);

-- Search function
CREATE OR REPLACE FUNCTION public.search_sharepoint_documents(
  _customer_id UUID,
  _search_query TEXT DEFAULT NULL,
  _file_types TEXT[] DEFAULT NULL,
  _limit INTEGER DEFAULT 50,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  web_url TEXT,
  thumbnail_url TEXT,
  modified_at TIMESTAMPTZ,
  modified_by TEXT,
  rank REAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sd.id,
    sd.file_name,
    sd.file_type,
    sd.file_size,
    sd.web_url,
    sd.thumbnail_url,
    sd.modified_at,
    sd.modified_by,
    CASE 
      WHEN _search_query IS NOT NULL THEN
        ts_rank(to_tsvector('english', COALESCE(sd.file_name, '') || ' ' || COALESCE(sd.content_text, '')), 
                plainto_tsquery('english', _search_query))
      ELSE 0.0
    END AS rank
  FROM public.sharepoint_documents sd
  WHERE sd.customer_id = _customer_id
    AND sd.sync_status = 'synced'
    AND (_search_query IS NULL OR 
         to_tsvector('english', COALESCE(sd.file_name, '') || ' ' || COALESCE(sd.content_text, '')) @@ 
         plainto_tsquery('english', _search_query))
    AND (_file_types IS NULL OR sd.file_type = ANY(_file_types))
  ORDER BY 
    CASE WHEN _search_query IS NOT NULL THEN rank ELSE 0 END DESC,
    sd.modified_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;