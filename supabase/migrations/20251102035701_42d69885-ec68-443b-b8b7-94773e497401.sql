-- Add feedback column to mcp_rag_queries table
ALTER TABLE public.mcp_rag_queries
ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('positive', 'negative'));

-- Add index for feedback queries
CREATE INDEX IF NOT EXISTS idx_mcp_rag_queries_feedback ON public.mcp_rag_queries(feedback) WHERE feedback IS NOT NULL;

COMMENT ON COLUMN public.mcp_rag_queries.feedback IS 'User feedback on RAG query quality (positive/negative)';