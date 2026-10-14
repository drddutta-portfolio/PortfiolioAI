-- One-off full 262-equity persisted reuse-first scan/readback.
-- This run represents database-cache recovery ONLY; it does not claim
-- any live NSE/Trendlyne provider acquisition or complete financial coverage.
-- Results R3 original primary bank observations were already inserted through
-- r3-batch-bank-cached-primary-filing-reuse.sql and independently read back.
WITH universe AS MATERIALIZED (
  SELECT DISTINCT t.security_id,p.id portfolio_id
  FROM public.transactions t
  JOIN public.portfolios p ON p.id=t.portfolio_id
  JOIN public.securities s ON s.id=t.security_id
  WHERE p.id='6193a4aa-3235-4057-bddc-209fcf443fc2'
    AND s.asset_class='EQUITY'
), recovered AS MATERIALIZED (
  SELECT f.security_id,count(*)::integer n
  FROM public.fundamental_observations f
  JOIN public.data_source_records src ON src.id=f.source_record_id
  WHERE src.record_kind='RESULTS_QUARTERLY_BANK_CACHE_REUSE'
  GROUP BY f.security_id
), dated AS MATERIALIZED (
  SELECT DISTINCT f.security_id
  FROM public.fundamental_observations f
  WHERE f.period_type='QUARTER' AND f.period_end IS NOT NULL AND f.numeric_value IS NOT NULL
    AND f.metric_code IN ('OPERATING_REVENUE_QUARTER','OPERATING_PROFIT_QUARTER',
      'ADVANCES_GROWTH_YOY','DEPOSITS_GROWTH_YOY','NET_INTEREST_INCOME_QUARTER',
      'NET_PROFIT_QUARTER','EPS_DILUTED','GROSS_NPA_PERCENT','NET_NPA_PERCENT')
), eligibility AS MATERIALIZED (
 SELECT u.security_id,u.portfolio_id,coalesce(r.n,0) new_rows,
   (d.security_id IS NOT NULL) has_old_results
 FROM universe u
 LEFT JOIN recovered r ON r.security_id=u.security_id
 LEFT JOIN dated d ON d.security_id=u.security_id
), created AS (
 INSERT INTO public.data_ingestion_runs
   (portfolio_id,source_code,operation,orchestration_type,trigger_source,status,
    completed_at,requested_count,cached_count,fetched_count,unchanged_count,failed_count,
    accepted_count,rejected_count,metadata)
 SELECT min(portfolio_id),'COMPANY_EXCHANGE_FILING','RESULTS_QUARTERLY_SCAN',
    'BOUNDED_REFRESH','MANUAL','PARTIAL',now(),count(*),
    count(*) FILTER (WHERE has_old_results),0,
    count(*) FILTER (WHERE new_rows=0 AND has_old_results),0,
    sum(new_rows),count(*) FILTER (WHERE NOT has_old_results),
    '{"mode":"ONE_TIME_FULL_UNIVERSE_CACHED_REUSE","batch_reference":"R3_20261014_CACHED_BANK_REUSE",
      "provider_calls":0,"new_web_downloads":0,"quarterly_pdf_extraction":"NOT_COMPLETE",
      "live_exchange_discovery":"NOT_COMPLETE","source_state":"REVIEW_PENDING",
      "not_portfolio_wide_data_complete":true}'::jsonb
 FROM eligibility
 HAVING count(*)=262
 AND NOT EXISTS (
  SELECT 1 FROM public.data_ingestion_runs old
  WHERE old.operation='RESULTS_QUARTERLY_SCAN'
    AND old.metadata->>'batch_reference'='R3_20261014_CACHED_BANK_REUSE'
 )
 RETURNING id
), items AS (
 INSERT INTO public.data_ingestion_run_items
 (ingestion_run_id,security_id,data_domain,status,safe_reason_code,
  attempted_call_count,accepted_record_count,completed_at,metadata)
 SELECT c.id,e.security_id,'QUARTERLY_RESULTS',
    CASE WHEN e.new_rows>0 THEN 'ACCEPTED'
         WHEN e.has_old_results THEN 'UNCHANGED'
         ELSE 'REJECTED' END,
    CASE WHEN e.new_rows>0 THEN 'QUALIFIED_CACHE_FACTS'
         WHEN e.has_old_results THEN 'ALREADY_DATED'
         ELSE 'NO_DATE_QUALIFIED_RESULT' END,
    0,e.new_rows,now(),
    jsonb_build_object('cache_only',true,'new_financial_observations',e.new_rows,
      'existing_dated_metrics',e.has_old_results,'provider_calls',0)
 FROM created c CROSS JOIN eligibility e
 ON CONFLICT (ingestion_run_id,security_id,data_domain) DO NOTHING
 RETURNING security_id,status,accepted_record_count
)
SELECT (SELECT count(*) FROM created) runs_inserted,
count(*) securities_checked,
count(*) FILTER (WHERE status='ACCEPTED') securities_with_new_metrics,
count(*) FILTER (WHERE status='UNCHANGED') securities_with_existing_metrics,
count(*) FILTER (WHERE status='REJECTED') securities_still_missing,
sum(accepted_record_count) observations_attached
FROM items;