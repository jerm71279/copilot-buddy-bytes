-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- MCP Knowledge Base table for RAG
CREATE TABLE public.mcp_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  server_id UUID REFERENCES public.mcp_servers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'document', -- document, api_doc, faq, guide
  source_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536), -- OpenAI ada-002 dimension
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mcp_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view knowledge for their customer"
  ON public.mcp_knowledge_base FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create knowledge for their customer"
  ON public.mcp_knowledge_base FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update knowledge for their customer"
  ON public.mcp_knowledge_base FOR UPDATE
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete knowledge for their customer"
  ON public.mcp_knowledge_base FOR DELETE
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_mcp_knowledge_customer ON public.mcp_knowledge_base(customer_id);
CREATE INDEX idx_mcp_knowledge_server ON public.mcp_knowledge_base(server_id);
CREATE INDEX idx_mcp_knowledge_tags ON public.mcp_knowledge_base USING GIN(tags);
CREATE INDEX idx_mcp_knowledge_embedding ON public.mcp_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full text search index
CREATE INDEX idx_mcp_knowledge_fts ON public.mcp_knowledge_base USING GIN(to_tsvector('english', title || ' ' || content));

-- RAG Query History
CREATE TABLE public.mcp_rag_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  server_id UUID REFERENCES public.mcp_servers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  query_text TEXT NOT NULL,
  retrieved_docs JSONB DEFAULT '[]'::jsonb,
  ai_response TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mcp_rag_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own queries"
  ON public.mcp_rag_queries FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create queries"
  ON public.mcp_rag_queries FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_rag_queries_customer ON public.mcp_rag_queries(customer_id);
CREATE INDEX idx_rag_queries_server ON public.mcp_rag_queries(server_id);
CREATE INDEX idx_rag_queries_user ON public.mcp_rag_queries(user_id);
CREATE INDEX idx_rag_queries_created ON public.mcp_rag_queries(created_at DESC);

-- Function for semantic search
CREATE OR REPLACE FUNCTION public.search_mcp_knowledge(
  query_embedding vector(1536),
  query_customer_id UUID,
  query_server_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  content_type TEXT,
  source_url TEXT,
  metadata JSONB,
  similarity FLOAT
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
    kb.content_type,
    kb.source_url,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.mcp_knowledge_base kb
  WHERE kb.customer_id = query_customer_id
    AND (query_server_id IS NULL OR kb.server_id = query_server_id)
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;