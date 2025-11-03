-- Create endpoints table for EDR
CREATE TABLE public.endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  ip_address TEXT,
  os_type TEXT NOT NULL,
  os_version TEXT,
  agent_version TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create endpoint_threats table
CREATE TABLE public.endpoint_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint_id UUID NOT NULL REFERENCES public.endpoints(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'detected',
  threat_name TEXT NOT NULL,
  file_path TEXT,
  process_name TEXT,
  description TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_accounts table
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  email_address TEXT NOT NULL,
  display_name TEXT,
  account_type TEXT NOT NULL DEFAULT 'microsoft365',
  is_monitored BOOLEAN DEFAULT true,
  last_scan TIMESTAMP WITH TIME ZONE,
  threat_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, email_address)
);

-- Create email_threats table
CREATE TABLE public.email_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'detected',
  subject TEXT,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  threat_details TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoint_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for endpoints
CREATE POLICY "Users can view endpoints for their customer"
ON public.endpoints FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert endpoints for their customer"
ON public.endpoints FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update endpoints for their customer"
ON public.endpoints FOR UPDATE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete endpoints for their customer"
ON public.endpoints FOR DELETE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

-- RLS Policies for endpoint_threats
CREATE POLICY "Users can view endpoint threats for their customer"
ON public.endpoint_threats FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert endpoint threats for their customer"
ON public.endpoint_threats FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update endpoint threats for their customer"
ON public.endpoint_threats FOR UPDATE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

-- RLS Policies for email_accounts
CREATE POLICY "Users can view email accounts for their customer"
ON public.email_accounts FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert email accounts for their customer"
ON public.email_accounts FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update email accounts for their customer"
ON public.email_accounts FOR UPDATE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

-- RLS Policies for email_threats
CREATE POLICY "Users can view email threats for their customer"
ON public.email_threats FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert email threats for their customer"
ON public.email_threats FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update email threats for their customer"
ON public.email_threats FOR UPDATE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_endpoints_customer_id ON public.endpoints(customer_id);
CREATE INDEX idx_endpoints_status ON public.endpoints(status);
CREATE INDEX idx_endpoint_threats_endpoint_id ON public.endpoint_threats(endpoint_id);
CREATE INDEX idx_endpoint_threats_customer_id ON public.endpoint_threats(customer_id);
CREATE INDEX idx_endpoint_threats_status ON public.endpoint_threats(status);
CREATE INDEX idx_email_accounts_customer_id ON public.email_accounts(customer_id);
CREATE INDEX idx_email_threats_account_id ON public.email_threats(email_account_id);
CREATE INDEX idx_email_threats_customer_id ON public.email_threats(customer_id);
CREATE INDEX idx_email_threats_status ON public.email_threats(status);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_endpoints_updated_at
BEFORE UPDATE ON public.endpoints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_endpoint_threats_updated_at
BEFORE UPDATE ON public.endpoint_threats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at
BEFORE UPDATE ON public.email_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_threats_updated_at
BEFORE UPDATE ON public.email_threats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();