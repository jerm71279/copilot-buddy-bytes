-- Integration Registry
CREATE TABLE integration_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL UNIQUE,
  system_type TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  connection_method TEXT NOT NULL,
  auth_method TEXT NOT NULL,
  base_url TEXT,
  api_version TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  health_status TEXT DEFAULT 'unknown',
  last_health_check TIMESTAMP WITH TIME ZONE,
  credential_vault_path TEXT,
  credential_rotation_schedule TEXT,
  last_credential_rotation TIMESTAMP WITH TIME ZONE,
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  documentation_url TEXT,
  edge_function_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  notes TEXT
);

-- Onboarding Checklist
CREATE TABLE integration_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integration_registry(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  step_number TEXT NOT NULL,
  step_description TEXT NOT NULL,
  responsible_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Logs
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  customer_id UUID,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Checks
CREATE TABLE integration_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integration_registry(id) ON DELETE CASCADE,
  health_status TEXT NOT NULL,
  latency_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_integration_logs_integration ON integration_logs(integration_name);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at DESC);
CREATE INDEX idx_integration_logs_status ON integration_logs(status);
CREATE INDEX idx_integration_health_checks_integration ON integration_health_checks(integration_id);
CREATE INDEX idx_integration_health_checks_checked_at ON integration_health_checks(checked_at DESC);
CREATE INDEX idx_integration_onboarding_checklist_integration ON integration_onboarding_checklist(integration_id);
CREATE INDEX idx_integration_onboarding_checklist_status ON integration_onboarding_checklist(status);

-- RLS Policies
ALTER TABLE integration_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health_checks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view integrations
CREATE POLICY "Users can view integrations" ON integration_registry
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage integrations
CREATE POLICY "Users can insert integrations" ON integration_registry
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update integrations" ON integration_registry
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete integrations" ON integration_registry
  FOR DELETE USING (auth.role() = 'authenticated');

-- Checklist policies
CREATE POLICY "Users can view checklist" ON integration_onboarding_checklist
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert checklist items" ON integration_onboarding_checklist
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update checklist" ON integration_onboarding_checklist
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete checklist items" ON integration_onboarding_checklist
  FOR DELETE USING (auth.role() = 'authenticated');

-- Logs policies
CREATE POLICY "Users can view logs" ON integration_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert logs" ON integration_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Health checks policies
CREATE POLICY "Users can view health checks" ON integration_health_checks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert health checks" ON integration_health_checks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');