-- Results R3 read-only quarterly acquisition qualification preflight.
-- No mutations; do not interpret source availability as canonical approval.
WITH candidate AS (
 SELECT id, security_id, metric_code, period_end, unit, consolidation_scope, published_at,
        source_record_id, evidence_status
 FROM public.fundamental_observations
 WHERE period_type='QUARTER'
   AND period_end IS NOT NULL
   AND numeric_value IS NOT NULL
   AND metric_code IN (
     'OPERATING_REVENUE_QUARTER', 'OPERATING_PROFIT_QUARTER',
     'ADVANCES_GROWTH_YOY', 'DEPOSITS_GROWTH_YOY'
   )
), selection AS (
 SELECT selected_observation_id FROM public.fundamental_observation_decisions
 WHERE selected_observation_id IS NOT NULL
)
SELECT
 COUNT(*) AS dated_candidate_rows,
 COUNT(DISTINCT candidate.security_id) AS distinct_securities,
 COUNT(DISTINCT (candidate.security_id, candidate.period_end)) AS distinct_stock_quarters,
 COUNT(*) FILTER (WHERE candidate.published_at IS NOT NULL) AS publication_timestamp_present,
 COUNT(*) FILTER (WHERE candidate.consolidation_scope IS NULL OR candidate.consolidation_scope='UNKNOWN') AS reporting_scope_unknown,
 COUNT(*) FILTER (WHERE candidate.source_record_id IS NULL) AS source_record_unlinked,
 COUNT(*) FILTER (WHERE candidate.evidence_status='AVAILABLE') AS provider_available_not_necessarily_approved,
 COUNT(*) FILTER (WHERE selection.selected_observation_id IS NOT NULL) AS canonically_selected_rows
FROM candidate LEFT JOIN selection ON selection.selected_observation_id = candidate.id;
