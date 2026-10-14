-- PortfolioAI Results R3: run after each ingestion/qualification batch.
-- Read-only. Transaction-linked equity identity, not a substitute for
-- canonical current-versus-closed positions.
WITH universe AS (
  SELECT DISTINCT t.security_id
  FROM public.transactions t
  JOIN public.securities s ON s.id=t.security_id
  WHERE s.asset_class='EQUITY'
),
dated AS (
 SELECT f.security_id, f.period_end, f.metric_code, f.consolidation_scope, f.source_record_id
 FROM public.fundamental_observations f
 WHERE f.period_type='QUARTER' AND f.period_end IS NOT NULL
 AND f.numeric_value IS NOT NULL AND f.metric_code IN (
   'OPERATING_REVENUE_QUARTER','OPERATING_PROFIT_QUARTER',
   'ADVANCES_GROWTH_YOY','DEPOSITS_GROWTH_YOY',
   'NET_INTEREST_INCOME_QUARTER','NET_PROFIT_QUARTER',
   'EPS_DILUTED','GROSS_NPA_PERCENT','NET_NPA_PERCENT'
 )
),
covered AS (SELECT DISTINCT security_id FROM dated)
SELECT COUNT(*) AS historically_transacted_equities,
COUNT(*) FILTER (WHERE covered.security_id IS NOT NULL) AS with_dated_quarter_metrics,
COUNT(*) FILTER (WHERE covered.security_id IS NULL) AS without_dated_quarter_metrics,
(SELECT COUNT(*) FROM dated) AS dated_observation_rows,
(SELECT COUNT(DISTINCT (security_id,period_end)) FROM dated) AS stock_quarter_combinations,
(SELECT COUNT(*) FROM public.fundamental_observation_decisions) AS canonical_selection_decisions
FROM universe LEFT JOIN covered ON covered.security_id=universe.security_id;
