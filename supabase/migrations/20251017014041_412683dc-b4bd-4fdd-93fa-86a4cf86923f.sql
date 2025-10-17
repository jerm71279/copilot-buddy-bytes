-- Slack Sync Configuration and Logs Tables
CREATE TABLE IF NOT EXISTS public.slack_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  workspace_id TEXT NOT NULL,
  workspace_name TEXT NOT NULL,
  channel_ids TEXT[] NOT NULL DEFAULT '{}',
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency_hours INTEGER NOT NULL DEFAULT 24,
  access_token_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, workspace_id)
);

CREATE TABLE IF NOT EXISTS public.slack_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_config_id UUID NOT NULL REFERENCES slack_sync_config(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  messages_synced INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  error_message TEXT,
  sync_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.slack_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage Slack config in their org"
  ON public.slack_sync_config
  FOR ALL
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view Slack sync logs in their org"
  ON public.slack_sync_logs
  FOR SELECT
  USING (sync_config_id IN (
    SELECT id FROM slack_sync_config 
    WHERE customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  ));

-- Indexes
CREATE INDEX idx_slack_config_customer ON slack_sync_config(customer_id);
CREATE INDEX idx_slack_logs_config ON slack_sync_logs(sync_config_id);
CREATE INDEX idx_slack_logs_status ON slack_sync_logs(status);