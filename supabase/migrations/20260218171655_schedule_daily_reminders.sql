-- Scheduled daily reminders via pg_cron (runs at 08:00 UTC every day)
SELECT cron.schedule(
  'daily-reminders',
  '0 8 * * *',
  $$SELECT net.http_post(
    url := 'https://lytoaknjphiirxxyzohd.supabase.co/functions/v1/check-reminders',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb
  )$$
);
