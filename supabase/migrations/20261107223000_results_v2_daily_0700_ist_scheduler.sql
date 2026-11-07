-- PortfolioAI Development ONLY: daily original-source scan at 07:00 Asia/Kolkata.
-- pg_cron runs on UTC: 01:30 UTC == 07:00 IST, year round (no DST).
-- All sensitive bearer values are resolved from Vault at execution time;
-- GitHub access tokens never appear in SQL or cron.job command text.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets
    WHERE name = 'portfolioai_results_scan_scheduler_token'
  ) THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32),'hex'),
      'portfolioai_results_scan_scheduler_token',
      'Dedicated server-to-server 07:00 IST PortfolioAI Results scan scheduler token'
    );
  END IF;
END;
$$;

-- Not callable by browsers; only the Edge service-role can verify the token.
CREATE OR REPLACE FUNCTION public.verify_results_scan_scheduler_token_v1(p_token text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT length(coalesce(p_token,''))=64
   AND p_token = (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name='portfolioai_results_scan_scheduler_token'
      LIMIT 1
   );
$$;
REVOKE ALL ON FUNCTION public.verify_results_scan_scheduler_token_v1(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_results_scan_scheduler_token_v1(text) TO service_role;

-- A dedicated job scheduler, strictly limited to the frozen Development
-- portfolio, guarded against overlapping manual scans and multiple scheduled
-- launches on the same India-local calendar day.
CREATE OR REPLACE FUNCTION public.results_scan_daily_dispatch_v1()
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_portfolio constant uuid := '6193a4aa-3235-4057-bddc-209fcf443fc2';
  url text;
  jwt text;
  token text;
  request_id bigint;
BEGIN
  IF current_database() IS NULL THEN
    RAISE EXCEPTION 'RESULTS_SCHEDULE_DATABASE_INVALID';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id=target_portfolio AND is_active
  ) THEN
    RAISE EXCEPTION 'RESULTS_SCHEDULE_APPROVED_PORTFOLIO_NOT_ACTIVE';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.data_ingestion_runs
    WHERE portfolio_id=target_portfolio
      AND operation='RESULTS_QUARTERLY_SCAN_V2'
      AND status='RUNNING'
  ) THEN
    RETURN NULL; -- Concurrent manual run is already executing.
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.data_ingestion_runs
    WHERE portfolio_id=target_portfolio
      AND operation='RESULTS_QUARTERLY_SCAN_V2'
      AND trigger_source='SCHEDULED'
      AND (started_at AT TIME ZONE 'Asia/Kolkata')::date
          = (now() AT TIME ZONE 'Asia/Kolkata')::date
  ) THEN
    RETURN NULL; -- Never dispatch a second scheduled run on the same IST day.
  END IF;

  SELECT decrypted_secret INTO url
    FROM vault.decrypted_secrets WHERE name='portfolioai_api_url';
  SELECT decrypted_secret INTO jwt
    FROM vault.decrypted_secrets WHERE name='portfolioai_publishable_key';
  SELECT decrypted_secret INTO token
    FROM vault.decrypted_secrets WHERE name='portfolioai_results_scan_scheduler_token';
  IF position('lrgpjimipfkyoqbpsqzz' in coalesce(url,''))=0
    OR nullif(jwt,'') IS NULL
    OR length(coalesce(token,''))<>64
  THEN
    RAISE EXCEPTION 'RESULTS_SCHEDULE_DEV_CONFIGURATION_INVALID';
  END IF;

  SELECT net.http_post(
    url:=rtrim(url,'/')||'/functions/v1/results-quarterly-scan-v2',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||jwt,
      'apikey',jwt,
      'x-portfolioai-results-scheduler-token',token
    ),
    body:=jsonb_build_object(
      'action','SCHEDULED_START',
      'portfolioId',target_portfolio::text
    ),
    timeout_milliseconds:=120000
  ) INTO request_id;
  IF request_id IS NULL THEN
    RAISE EXCEPTION 'RESULTS_SCHEDULE_NETWORK_ENQUEUE_FAILED';
  END IF;
  RETURN request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.results_scan_daily_dispatch_v1() FROM PUBLIC, anon, authenticated, service_role;

-- Supabase pg_cron is configured in UTC; 01:30 UTC = 07:00 IST.
SELECT cron.schedule(
  'portfolioai-results-quarterly-scan-0700-ist',
  '30 1 * * *',
  'SELECT public.results_scan_daily_dispatch_v1();'
);
