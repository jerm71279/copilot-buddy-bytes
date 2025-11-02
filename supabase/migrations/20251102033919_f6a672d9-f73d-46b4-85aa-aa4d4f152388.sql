-- Add chunking support to knowledge base
ALTER TABLE public.mcp_knowledge_base
  ADD COLUMN is_chunked BOOLEAN DEFAULT false,
  ADD COLUMN parent_document_id UUID REFERENCES public.mcp_knowledge_base(id) ON DELETE CASCADE,
  ADD COLUMN chunk_index INTEGER,
  ADD COLUMN chunk_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN total_chunks INTEGER;

-- Create index for chunk queries
CREATE INDEX idx_knowledge_parent_doc ON public.mcp_knowledge_base(parent_document_id) WHERE parent_document_id IS NOT NULL;
CREATE INDEX idx_knowledge_chunk_index ON public.mcp_knowledge_base(chunk_index) WHERE chunk_index IS NOT NULL;

-- Document Chunking Settings table
CREATE TABLE public.mcp_chunking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL DEFAULT 'paragraph', -- paragraph, token, semantic, hybrid
  chunk_size INTEGER NOT NULL DEFAULT 1000, -- tokens or characters
  chunk_overlap INTEGER NOT NULL DEFAULT 200, -- overlap between chunks
  min_chunk_size INTEGER NOT NULL DEFAULT 100,
  separator TEXT DEFAULT '\n\n', -- for paragraph strategy
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

-- Enable RLS
ALTER TABLE public.mcp_chunking_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chunking settings
CREATE POLICY "Users can view chunking settings for their customer"
  ON public.mcp_chunking_settings FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage chunking settings for their customer"
  ON public.mcp_chunking_settings FOR ALL
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create index
CREATE INDEX idx_chunking_settings_customer ON public.mcp_chunking_settings(customer_id);

-- Function to get chunks with context
CREATE OR REPLACE FUNCTION public.get_knowledge_chunks_with_context(
  parent_doc_id UUID,
  chunk_idx INTEGER,
  context_window INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  chunk_index INTEGER,
  is_current BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.chunk_index,
    kb.chunk_index = chunk_idx AS is_current
  FROM public.mcp_knowledge_base kb
  WHERE kb.parent_document_id = parent_doc_id
    AND kb.chunk_index >= (chunk_idx - context_window)
    AND kb.chunk_index <= (chunk_idx + context_window)
  ORDER BY kb.chunk_index;
END;
$$;

-- Update search function to handle chunks
CREATE OR REPLACE FUNCTION public.search_mcp_knowledge_chunks(
  query_embedding vector(1536),
  query_customer_id UUID,
  query_server_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  include_context BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  content_type TEXT,
  source_url TEXT,
  metadata JSONB,
  similarity FLOAT,
  is_chunk BOOLEAN,
  parent_document_id UUID,
  chunk_index INTEGER,
  total_chunks INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    CASE 
      WHEN kb.parent_document_id IS NOT NULL THEN 
        (SELECT title FROM public.mcp_knowledge_base WHERE id = kb.parent_document_id)
      ELSE kb.title
    END AS title,
    kb.content,
    kb.content_type,
    kb.source_url,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity,
    kb.parent_document_id IS NOT NULL AS is_chunk,
    kb.parent_document_id,
    kb.chunk_index,
    kb.total_chunks
  FROM public.mcp_knowledge_base kb
  WHERE kb.customer_id = query_customer_id
    AND (query_server_id IS NULL OR kb.server_id = query_server_id)
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;