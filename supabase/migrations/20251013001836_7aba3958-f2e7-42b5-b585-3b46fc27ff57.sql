-- Create trusted_devices table for SAW registration
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('workstation', 'laptop', 'mobile', 'server')),
  mac_address MACADDR,
  ip_address INET,
  hostname TEXT,
  operating_system TEXT,
  is_saw BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  registered_by UUID NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  device_metadata JSONB DEFAULT '{}'::jsonb,
  security_level TEXT NOT NULL DEFAULT 'standard' CHECK (security_level IN ('standard', 'elevated', 'privileged')),
  requires_mfa BOOLEAN DEFAULT false,
  allowed_operations TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ip_allowlist table
CREATE TABLE IF NOT EXISTS public.ip_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  ip_range CIDR NOT NULL,
  description TEXT,
  allowlist_type TEXT NOT NULL CHECK (allowlist_type IN ('privileged', 'admin', 'standard')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create device_sessions table for session monitoring
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.trusted_devices(id),
  device_fingerprint TEXT NOT NULL,
  ip_address INET NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('standard', 'privileged', 'break_glass')),
  privileged_operations JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end TIMESTAMPTZ,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  risk_score INTEGER DEFAULT 0,
  anomalies_detected JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create break_glass_access table
CREATE TABLE IF NOT EXISTS public.break_glass_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  approved_by UUID,
  device_id UUID REFERENCES public.trusted_devices(id),
  reason TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('emergency', 'maintenance', 'audit')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'revoked')),
  access_granted BOOLEAN DEFAULT false,
  session_id UUID REFERENCES public.device_sessions(id),
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_glass_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trusted_devices
CREATE POLICY "Admins can manage trusted devices"
ON public.trusted_devices
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view devices in their organization"
ON public.trusted_devices
FOR SELECT
USING (customer_id IN (
  SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
));

-- RLS Policies for ip_allowlist
CREATE POLICY "Admins can manage IP allowlist"
ON public.ip_allowlist
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view IP allowlist in their organization"
ON public.ip_allowlist
FOR SELECT
USING (customer_id IN (
  SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
));

-- RLS Policies for device_sessions
CREATE POLICY "Admins can view all device sessions"
ON public.device_sessions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own sessions"
ON public.device_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create sessions"
ON public.device_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS Policies for break_glass_access
CREATE POLICY "Admins can manage break glass access"
ON public.break_glass_access
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create break glass requests"
ON public.break_glass_access
FOR INSERT
WITH CHECK (
  requested_by = auth.uid() AND
  customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their break glass requests"
ON public.break_glass_access
FOR SELECT
USING (
  requested_by = auth.uid() OR
  user_id = auth.uid()
);

-- Create indexes for performance
CREATE INDEX idx_trusted_devices_customer ON public.trusted_devices(customer_id);
CREATE INDEX idx_trusted_devices_fingerprint ON public.trusted_devices(device_fingerprint);
CREATE INDEX idx_trusted_devices_is_saw ON public.trusted_devices(is_saw) WHERE is_saw = true;
CREATE INDEX idx_ip_allowlist_customer ON public.ip_allowlist(customer_id);
CREATE INDEX idx_device_sessions_user ON public.device_sessions(user_id);
CREATE INDEX idx_device_sessions_active ON public.device_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_break_glass_status ON public.break_glass_access(status);

-- Create function to validate device access
CREATE OR REPLACE FUNCTION public.validate_device_access(
  _device_fingerprint TEXT,
  _ip_address INET,
  _customer_id UUID,
  _requires_privileged BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  device_record RECORD;
  ip_allowed BOOLEAN := false;
  result JSONB;
BEGIN
  -- Check if device is registered
  SELECT * INTO device_record
  FROM trusted_devices
  WHERE device_fingerprint = _device_fingerprint
    AND customer_id = _customer_id
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'device_not_registered',
      'requires_registration', true
    );
  END IF;
  
  -- Check if IP is in allowlist (if privileged access required)
  IF _requires_privileged THEN
    SELECT EXISTS (
      SELECT 1 FROM ip_allowlist
      WHERE customer_id = _customer_id
        AND _ip_address <<= ip_range
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND allowlist_type IN ('privileged', 'admin')
    ) INTO ip_allowed;
    
    IF NOT ip_allowed THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'ip_not_allowlisted',
        'requires_vpn', true
      );
    END IF;
    
    -- Check if device is SAW for privileged operations
    IF NOT device_record.is_saw THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'not_secure_workstation',
        'requires_saw', true
      );
    END IF;
  END IF;
  
  -- Update last seen
  UPDATE trusted_devices
  SET last_seen_at = now(),
      ip_address = _ip_address
  WHERE id = device_record.id;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'device_id', device_record.id,
    'device_name', device_record.device_name,
    'security_level', device_record.security_level,
    'requires_mfa', device_record.requires_mfa,
    'is_saw', device_record.is_saw
  );
END;
$$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_saw_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_trusted_devices_updated_at
BEFORE UPDATE ON public.trusted_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_saw_updated_at();

CREATE TRIGGER update_ip_allowlist_updated_at
BEFORE UPDATE ON public.ip_allowlist
FOR EACH ROW
EXECUTE FUNCTION public.update_saw_updated_at();

CREATE TRIGGER update_break_glass_updated_at
BEFORE UPDATE ON public.break_glass_access
FOR EACH ROW
EXECUTE FUNCTION public.update_saw_updated_at();