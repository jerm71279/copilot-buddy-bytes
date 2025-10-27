-- Create security_audit_logs table for tracking AI security events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  edge_function TEXT NOT NULL,
  threat_details JSONB,
  action_taken TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security audit logs
-- Super admins can view all logs
CREATE POLICY "Super admins can view all security logs"
  ON public.security_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- Customer admins can view their own logs
CREATE POLICY "Customer admins can view their security logs"
  ON public.security_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.user_roles ur ON ur.user_id = up.user_id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE up.user_id = auth.uid()
      AND up.customer_id = security_audit_logs.customer_id
      AND r.name IN ('admin', 'customer')
    )
  );

-- System can insert logs (service role)
CREATE POLICY "System can insert security logs"
  ON public.security_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_security_audit_logs_customer_id ON public.security_audit_logs(customer_id);
CREATE INDEX idx_security_audit_logs_severity ON public.security_audit_logs(severity);
CREATE INDEX idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);

COMMENT ON TABLE public.security_audit_logs IS 'Tracks AI security events including prompt injection attempts, tool call validation failures, and rate limiting';
COMMENT ON COLUMN public.security_audit_logs.event_type IS 'Type of security event: prompt_injection_detected, prompt_injection_blocked, tool_call_validation_failed, rate_limit_exceeded, etc.';
COMMENT ON COLUMN public.security_audit_logs.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN public.security_audit_logs.threat_details IS 'JSON object containing threat-specific details like injection type, confidence score, tool name, etc.';
COMMENT ON COLUMN public.security_audit_logs.action_taken IS 'Description of what action was taken in response to the security event';