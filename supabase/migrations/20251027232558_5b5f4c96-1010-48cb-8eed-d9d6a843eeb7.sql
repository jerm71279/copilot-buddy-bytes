-- Create CVE tracking tables
CREATE TABLE IF NOT EXISTS public.cve_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cve_id TEXT NOT NULL UNIQUE,
  description TEXT,
  severity TEXT,
  cvss_score DECIMAL(3,1),
  published_date TIMESTAMP WITH TIME ZONE,
  last_modified_date TIMESTAMP WITH TIME ZONE,
  affected_products TEXT[],
  reference_urls JSONB,
  cwe_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_cve_entries_cve_id ON public.cve_entries(cve_id);
CREATE INDEX idx_cve_entries_published_date ON public.cve_entries(published_date DESC);
CREATE INDEX idx_cve_entries_severity ON public.cve_entries(severity);

-- Create CVE sync log table
CREATE TABLE IF NOT EXISTS public.cve_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  cves_fetched INTEGER DEFAULT 0,
  cves_new INTEGER DEFAULT 0,
  cves_updated INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cve_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cve_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read CVE data
CREATE POLICY "Authenticated users can view CVE entries"
ON public.cve_entries
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view CVE sync logs"
ON public.cve_sync_logs
FOR SELECT
USING (auth.role() = 'authenticated');

-- Service role can manage all CVE data
CREATE POLICY "Service role can manage CVE entries"
ON public.cve_entries
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage CVE sync logs"
ON public.cve_sync_logs
FOR ALL
USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_cve_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cve_entries_updated_at
BEFORE UPDATE ON public.cve_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_cve_updated_at_column();