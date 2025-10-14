-- Failed Login Tracking & Account Lockout
CREATE TABLE failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users,
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  failure_reason TEXT NOT NULL,
  geo_location JSONB,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_failed_login_email ON failed_login_attempts(email, attempted_at DESC);
CREATE INDEX idx_failed_login_ip ON failed_login_attempts(ip_address, attempted_at DESC);

ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view failed login attempts"
  ON failed_login_attempts FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Account Lockouts
CREATE TABLE account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  email TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ NOT NULL,
  lock_reason TEXT NOT NULL,
  failed_attempt_count INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ,
  unlocked_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_lockouts_email ON account_lockouts(email, locked_until DESC);

ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lockouts"
  ON account_lockouts FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Lateral Movement Detection
CREATE TABLE lateral_movement_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users,
  from_resource TEXT NOT NULL,
  to_resource TEXT NOT NULL,
  access_pattern TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  was_blocked BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lateral_movement_user ON lateral_movement_indicators(user_id, triggered_at DESC);
CREATE INDEX idx_lateral_movement_risk ON lateral_movement_indicators(risk_score DESC, triggered_at DESC);

ALTER TABLE lateral_movement_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view lateral movement"
  ON lateral_movement_indicators FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Data Exfiltration Monitoring
CREATE TABLE data_access_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users,
  table_accessed TEXT NOT NULL,
  records_queried INTEGER NOT NULL,
  data_size_mb NUMERIC,
  normal_baseline INTEGER,
  deviation_percentage NUMERIC,
  export_attempted BOOLEAN DEFAULT false,
  was_blocked BOOLEAN DEFAULT false,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_anomalies_user ON data_access_anomalies(user_id, flagged_at DESC);
CREATE INDEX idx_data_anomalies_deviation ON data_access_anomalies(deviation_percentage DESC NULLS LAST);

ALTER TABLE data_access_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view data anomalies"
  ON data_access_anomalies FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Threat Intelligence
CREATE TABLE threat_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  indicator_type TEXT NOT NULL,
  indicator_value TEXT NOT NULL,
  threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  source TEXT NOT NULL,
  description TEXT,
  block_automatically BOOLEAN DEFAULT false,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, indicator_type, indicator_value)
);

CREATE INDEX idx_threat_indicators_type ON threat_indicators(indicator_type, threat_level);
CREATE INDEX idx_threat_indicators_value ON threat_indicators(indicator_value);

ALTER TABLE threat_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage threat indicators"
  ON threat_indicators FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Attack Kill Chain Mapping
CREATE TABLE attack_chain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  chain_id UUID NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command_control', 'actions_on_objectives')),
  user_id UUID REFERENCES auth.users,
  ip_address INET,
  event_details JSONB NOT NULL,
  was_prevented BOOLEAN DEFAULT false,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attack_chain_id ON attack_chain_events(chain_id, detected_at DESC);
CREATE INDEX idx_attack_chain_stage ON attack_chain_events(stage, severity);
CREATE INDEX idx_attack_chain_user ON attack_chain_events(user_id, detected_at DESC);

ALTER TABLE attack_chain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view attack chains"
  ON attack_chain_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Honeypot Resources
CREATE TABLE honeypot_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('table', 'endpoint', 'file', 'credential')),
  resource_name TEXT NOT NULL,
  description TEXT,
  is_trap BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, resource_type, resource_name)
);

ALTER TABLE honeypot_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage honeypots"
  ON honeypot_resources FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Honeypot Access Log
CREATE TABLE honeypot_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users,
  resource_id UUID NOT NULL REFERENCES honeypot_resources,
  ip_address INET,
  access_attempt JSONB NOT NULL,
  auto_blocked BOOLEAN DEFAULT true,
  incident_id UUID,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_honeypot_access_user ON honeypot_access_log(user_id, accessed_at DESC);
CREATE INDEX idx_honeypot_access_resource ON honeypot_access_log(resource_id, accessed_at DESC);

ALTER TABLE honeypot_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view honeypot access"
  ON honeypot_access_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Automated Response Rules
CREATE TABLE automated_response_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  threshold JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automated_response_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage response rules"
  ON automated_response_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Response Executions Log
CREATE TABLE response_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES automated_response_rules,
  triggered_by_event UUID,
  actions_taken JSONB NOT NULL,
  was_successful BOOLEAN NOT NULL,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_response_exec_rule ON response_executions(rule_id, executed_at DESC);

ALTER TABLE response_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view response executions"
  ON response_executions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Privilege Usage Patterns
CREATE TABLE privilege_usage_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users,
  role_id UUID REFERENCES roles,
  permission_used TEXT NOT NULL,
  usage_frequency INTEGER NOT NULL DEFAULT 0,
  current_usage INTEGER NOT NULL DEFAULT 0,
  baseline_calculated_at TIMESTAMPTZ,
  is_anomalous BOOLEAN DEFAULT false,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, user_id, permission_used)
);

CREATE INDEX idx_privilege_usage_user ON privilege_usage_patterns(user_id, is_anomalous);
CREATE INDEX idx_privilege_usage_anomalous ON privilege_usage_patterns(is_anomalous, risk_score DESC);

ALTER TABLE privilege_usage_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view privilege patterns"
  ON privilege_usage_patterns FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Security Control Tests
CREATE TABLE security_control_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  control_name TEXT NOT NULL,
  control_category TEXT NOT NULL,
  test_scenario TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  passed BOOLEAN,
  tested_at TIMESTAMPTZ,
  next_test_due TIMESTAMPTZ,
  test_frequency_days INTEGER DEFAULT 30,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_tests_due ON security_control_tests(next_test_due);
CREATE INDEX idx_security_tests_passed ON security_control_tests(passed, tested_at DESC);

ALTER TABLE security_control_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security tests"
  ON security_control_tests FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- User Entity Behavior Analytics (UEBA) Baselines
CREATE TABLE user_behavior_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users,
  avg_login_time TIME,
  typical_ip_ranges INET[],
  normal_resources_accessed TEXT[],
  typical_query_patterns JSONB,
  standard_work_hours_start TIME,
  standard_work_hours_end TIME,
  typical_login_frequency INTEGER,
  avg_session_duration_minutes INTEGER,
  baseline_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_points_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, user_id)
);

CREATE INDEX idx_user_baselines_user ON user_behavior_baselines(user_id);

ALTER TABLE user_behavior_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view user baselines"
  ON user_behavior_baselines FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Behavioral Deviations
CREATE TABLE behavioral_deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users,
  deviation_type TEXT NOT NULL,
  baseline_value TEXT,
  actual_value TEXT,
  deviation_score INTEGER CHECK (deviation_score >= 0 AND deviation_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  was_flagged BOOLEAN DEFAULT true,
  was_investigated BOOLEAN DEFAULT false,
  investigated_by UUID REFERENCES auth.users,
  investigation_notes TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_behavioral_dev_user ON behavioral_deviations(user_id, detected_at DESC);
CREATE INDEX idx_behavioral_dev_risk ON behavioral_deviations(risk_level, was_investigated);

ALTER TABLE behavioral_deviations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view behavioral deviations"
  ON behavioral_deviations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update investigations"
  ON behavioral_deviations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- API Rate Limiting Tracker
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL,
  was_throttled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_rate_ip_endpoint ON api_rate_limits(ip_address, endpoint, window_end DESC);
CREATE INDEX idx_api_rate_user ON api_rate_limits(user_id, window_end DESC);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate limits"
  ON api_rate_limits FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- SOC Dashboard Summary View
CREATE VIEW soc_security_overview AS
SELECT 
  c.id as customer_id,
  c.company_name,
  -- Failed Logins (last 24h)
  (SELECT COUNT(*) FROM failed_login_attempts fla 
   WHERE fla.customer_id = c.id AND fla.attempted_at > now() - interval '24 hours') as failed_logins_24h,
  -- Active Lockouts
  (SELECT COUNT(*) FROM account_lockouts al 
   WHERE al.customer_id = c.id AND al.locked_until > now() AND al.unlocked_at IS NULL) as active_lockouts,
  -- High Risk Anomalies (last 24h)
  (SELECT COUNT(*) FROM anomaly_detections ad 
   WHERE ad.customer_id = c.id AND ad.severity IN ('high', 'critical') 
   AND ad.created_at > now() - interval '24 hours') as high_risk_anomalies_24h,
  -- Lateral Movement Detections
  (SELECT COUNT(*) FROM lateral_movement_indicators lmi 
   WHERE lmi.customer_id = c.id AND lmi.risk_score > 70 
   AND lmi.triggered_at > now() - interval '24 hours') as lateral_movement_24h,
  -- Data Exfiltration Attempts
  (SELECT COUNT(*) FROM data_access_anomalies daa 
   WHERE daa.customer_id = c.id AND daa.export_attempted = true 
   AND daa.flagged_at > now() - interval '24 hours') as exfiltration_attempts_24h,
  -- Active Threat Indicators
  (SELECT COUNT(*) FROM threat_indicators ti 
   WHERE ti.customer_id = c.id AND ti.threat_level IN ('high', 'critical')) as active_threats,
  -- Attack Chains in Progress
  (SELECT COUNT(DISTINCT chain_id) FROM attack_chain_events ace 
   WHERE ace.customer_id = c.id AND ace.was_prevented = false 
   AND ace.detected_at > now() - interval '1 hour') as active_attack_chains,
  -- Honeypot Triggers (last 24h)
  (SELECT COUNT(*) FROM honeypot_access_log hal 
   WHERE hal.customer_id = c.id 
   AND hal.accessed_at > now() - interval '24 hours') as honeypot_triggers_24h,
  -- Behavioral Deviations (uninvestigated)
  (SELECT COUNT(*) FROM behavioral_deviations bd 
   WHERE bd.customer_id = c.id AND bd.was_investigated = false 
   AND bd.risk_level IN ('high', 'critical')) as critical_deviations,
  -- Automated Responses (last 24h)
  (SELECT COUNT(*) FROM response_executions re 
   WHERE re.customer_id = c.id 
   AND re.executed_at > now() - interval '24 hours') as auto_responses_24h
FROM customers c;