-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule CVE sync to run daily at 2 AM UTC
SELECT cron.schedule(
  'daily-cve-sync',
  '0 2 * * *', -- Run at 2 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://olrpexessehcijdvogxo.supabase.co/functions/v1/cve-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scnBleGVzc2VoY2lqZHZvZ3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Njc3MjIsImV4cCI6MjA3NTA0MzcyMn0.TQ1jthqKDE7VfbJu9CCMwc6p6p8J7Z2qhPf3fz7fub8"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);