-- MCP Server Discovery Tables
-- Store discovered MCP servers before they're installed

CREATE TABLE IF NOT EXISTS public.mcp_discovered_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  server_name TEXT,
  provider TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  capabilities JSONB DEFAULT '[]'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  response_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('discovered', 'verified', 'installed', 'failed')),
  is_installed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  UNIQUE(customer_id, endpoint_url)
);

-- Discovery scan history
CREATE TABLE IF NOT EXISTS public.mcp_discovery_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('manual', 'scheduled', 'auto')),
  endpoints_scanned INTEGER NOT NULL DEFAULT 0,
  servers_found INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.mcp_discovered_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_discovery_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mcp_discovered_servers
CREATE POLICY "Users can view discovered servers for their customer"
  ON public.mcp_discovered_servers
  FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert discovered servers for their customer"
  ON public.mcp_discovered_servers
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update discovered servers for their customer"
  ON public.mcp_discovered_servers
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for mcp_discovery_scans
CREATE POLICY "Users can view discovery scans for their customer"
  ON public.mcp_discovery_scans
  FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert discovery scans for their customer"
  ON public.mcp_discovery_scans
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_mcp_discovered_servers_customer ON public.mcp_discovered_servers(customer_id);
CREATE INDEX idx_mcp_discovered_servers_status ON public.mcp_discovered_servers(status);
CREATE INDEX idx_mcp_discovery_scans_customer ON public.mcp_discovery_scans(customer_id);
CREATE INDEX idx_mcp_discovery_scans_status ON public.mcp_discovery_scans(status);