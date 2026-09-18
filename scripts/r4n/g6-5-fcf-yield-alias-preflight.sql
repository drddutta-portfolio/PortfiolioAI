\set ON_ERROR_STOP on
\pset pager off
BEGIN TRANSACTION READ ONLY;

\echo ''
\echo '=== R4N G6.5 LOCAL FCF-YIELD ALIAS PREFLIGHT ==='
\echo 'READ ONLY: no rows will be inserted, updated, or deleted.'
\echo ''

\echo '--- TORNTPHARM security identity ---'
SELECT id, symbol, exchange, name, is_active
FROM public.securities
WHERE symbol = 'TORNTPHARM'
ORDER BY exchange, id;

\echo ''
\echo '--- Metric definitions for canonical + legacy identities ---'
SELECT code, name, value_kind, canonical_unit, statement_scope, freshness_seconds, is_active, definition
FROM public.fundamental_metric_definitions
WHERE code IN ('FCF_YIELD', 'FCF_YIELD_PERCENT')
ORDER BY code;

\echo ''
\echo '--- Definition summary ---'
WITH defs AS (
  SELECT code
  FROM public.fundamental_metric_definitions
  WHERE code IN ('FCF_YIELD', 'FCF_YIELD_PERCENT')
)
SELECT
  count(*) FILTER (WHERE code = 'FCF_YIELD') AS legacy_definition_rows,
  count(*) FILTER (WHERE code = 'FCF_YIELD_PERCENT') AS canonical_definition_rows,
  count(*) AS total_definition_rows,
  CASE
    WHEN count(*) = 0 THEN 'NO_FCF_YIELD_DEFINITIONS'
    WHEN count(*) FILTER (WHERE code = 'FCF_YIELD_PERCENT') = 1
      AND count(*) FILTER (WHERE code = 'FCF_YIELD') = 0 THEN 'CANONICAL_ONLY'
    WHEN count(*) FILTER (WHERE code = 'FCF_YIELD_PERCENT') = 0
      AND count(*) FILTER (WHERE code = 'FCF_YIELD') = 1 THEN 'LEGACY_ONLY'
    WHEN count(*) FILTER (WHERE code = 'FCF_YIELD_PERCENT') = 1
      AND count(*) FILTER (WHERE code = 'FCF_YIELD') = 1 THEN 'BOTH_IDENTITIES_PRESENT'
    ELSE 'NON_UNIQUE_OR_UNEXPECTED'
  END AS definition_state
FROM defs;

\echo ''
\echo '--- TORNTPHARM FCF-yield observations ---'
WITH target AS (
  SELECT id FROM public.securities
  WHERE symbol = 'TORNTPHARM' AND exchange = 'NSE' AND is_active
)
SELECT
  f.id, f.metric_code, f.numeric_value, f.unit, f.period_start, f.period_end,
  f.period_type, f.consolidation_scope, f.source_code, f.source_record_id,
  f.observed_at, f.retrieved_at, f.fresh_until, f.evidence_status
FROM public.fundamental_observations f
JOIN target t ON t.id = f.security_id
WHERE f.metric_code IN ('FCF_YIELD', 'FCF_YIELD_PERCENT')
ORDER BY f.period_end DESC NULLS LAST, f.retrieved_at DESC, f.metric_code;

\echo ''
\echo '--- TORNTPHARM observation summary ---'
WITH target AS (
  SELECT id FROM public.securities
  WHERE symbol = 'TORNTPHARM' AND exchange = 'NSE' AND is_active
), obs AS (
  SELECT f.*
  FROM public.fundamental_observations f
  JOIN target t ON t.id = f.security_id
  WHERE f.metric_code IN ('FCF_YIELD', 'FCF_YIELD_PERCENT')
)
SELECT
  count(*) FILTER (WHERE metric_code = 'FCF_YIELD') AS legacy_observations,
  count(*) FILTER (WHERE metric_code = 'FCF_YIELD_PERCENT') AS canonical_observations,
  count(*) AS total_observations,
  CASE
    WHEN count(*) = 0 THEN 'NO_PERSISTED_FCF_YIELD_OBSERVATIONS'
    WHEN count(*) FILTER (WHERE metric_code = 'FCF_YIELD') > 0
      AND count(*) FILTER (WHERE metric_code = 'FCF_YIELD_PERCENT') > 0 THEN 'BOTH_IDENTITIES_HAVE_OBSERVATIONS'
    WHEN count(*) FILTER (WHERE metric_code = 'FCF_YIELD_PERCENT') > 0 THEN 'CANONICAL_OBSERVATIONS_ONLY'
    WHEN count(*) FILTER (WHERE metric_code = 'FCF_YIELD') > 0 THEN 'LEGACY_OBSERVATIONS_ONLY'
    ELSE 'UNEXPECTED'
  END AS observation_state
FROM obs;

\echo ''
\echo '--- Potential duplicate economic evidence across aliases ---'
WITH target AS (
  SELECT id FROM public.securities
  WHERE symbol = 'TORNTPHARM' AND exchange = 'NSE' AND is_active
), obs AS (
  SELECT f.*
  FROM public.fundamental_observations f
  JOIN target t ON t.id = f.security_id
  WHERE f.metric_code IN ('FCF_YIELD', 'FCF_YIELD_PERCENT')
)
SELECT
  l.id AS legacy_observation_id,
  c.id AS canonical_observation_id,
  l.numeric_value AS legacy_value,
  c.numeric_value AS canonical_value,
  l.unit AS legacy_unit,
  c.unit AS canonical_unit,
  l.period_end,
  l.period_type,
  l.source_code AS legacy_source,
  c.source_code AS canonical_source,
  CASE
    WHEN l.numeric_value = c.numeric_value AND l.unit IS NOT DISTINCT FROM c.unit
      THEN 'EXACT_ALIAS_DUPLICATE'
    ELSE 'ALIAS_CONFLICT'
  END AS duplicate_state
FROM obs l
JOIN obs c
  ON l.metric_code = 'FCF_YIELD'
 AND c.metric_code = 'FCF_YIELD_PERCENT'
 AND l.period_end IS NOT DISTINCT FROM c.period_end
 AND l.period_type IS NOT DISTINCT FROM c.period_type
 AND l.consolidation_scope IS NOT DISTINCT FROM c.consolidation_scope
 AND l.source_code IS NOT DISTINCT FROM c.source_code
ORDER BY l.period_end DESC NULLS LAST, l.retrieved_at DESC;

\echo ''
\echo '--- Global usage counts across all securities ---'
SELECT
  metric_code,
  count(*) AS observation_count,
  count(DISTINCT security_id) AS security_count,
  min(retrieved_at) AS first_retrieved_at,
  max(retrieved_at) AS latest_retrieved_at
FROM public.fundamental_observations
WHERE metric_code IN ('FCF_YIELD', 'FCF_YIELD_PERCENT')
GROUP BY metric_code
ORDER BY metric_code;

\echo ''
\echo '--- G6.5 preflight classification ---'
WITH defs AS (
  SELECT code FROM public.fundamental_metric_definitions
  WHERE code IN ('FCF_YIELD', 'FCF_YIELD_PERCENT')
), target AS (
  SELECT id FROM public.securities
  WHERE symbol = 'TORNTPHARM' AND exchange = 'NSE' AND is_active
), obs AS (
  SELECT f.*
  FROM public.fundamental_observations f
  JOIN target t ON t.id = f.security_id
  WHERE f.metric_code IN ('FCF_YIELD', 'FCF_YIELD_PERCENT')
), dupes AS (
  SELECT
    count(*) AS duplicate_pairs,
    count(*) FILTER (
      WHERE l.numeric_value IS DISTINCT FROM c.numeric_value
         OR l.unit IS DISTINCT FROM c.unit
    ) AS conflict_pairs
  FROM obs l
  JOIN obs c
    ON l.metric_code = 'FCF_YIELD'
   AND c.metric_code = 'FCF_YIELD_PERCENT'
   AND l.period_end IS NOT DISTINCT FROM c.period_end
   AND l.period_type IS NOT DISTINCT FROM c.period_type
   AND l.consolidation_scope IS NOT DISTINCT FROM c.consolidation_scope
   AND l.source_code IS NOT DISTINCT FROM c.source_code
)
SELECT
  (SELECT count(*) FILTER (WHERE code = 'FCF_YIELD') FROM defs) AS legacy_definition_rows,
  (SELECT count(*) FILTER (WHERE code = 'FCF_YIELD_PERCENT') FROM defs) AS canonical_definition_rows,
  (SELECT count(*) FILTER (WHERE metric_code = 'FCF_YIELD') FROM obs) AS legacy_observations,
  (SELECT count(*) FILTER (WHERE metric_code = 'FCF_YIELD_PERCENT') FROM obs) AS canonical_observations,
  (SELECT duplicate_pairs FROM dupes) AS alias_duplicate_pairs,
  (SELECT conflict_pairs FROM dupes) AS alias_conflict_pairs,
  CASE
    WHEN (SELECT conflict_pairs FROM dupes) > 0 THEN 'BLOCKED_ALIAS_CONFLICT'
    WHEN (SELECT duplicate_pairs FROM dupes) > 0 THEN 'RECONCILIATION_REQUIRED_EXACT_DUPLICATES'
    WHEN (SELECT count(*) FROM obs) = 0 THEN 'NO_PERSISTED_OBSERVATIONS'
    WHEN (SELECT count(*) FILTER (WHERE metric_code = 'FCF_YIELD') FROM obs) > 0
      AND (SELECT count(*) FILTER (WHERE metric_code = 'FCF_YIELD_PERCENT') FROM obs) = 0
      THEN 'LEGACY_ONLY_RECONCILIATION_REQUIRED'
    WHEN (SELECT count(*) FILTER (WHERE metric_code = 'FCF_YIELD') FROM obs) = 0
      AND (SELECT count(*) FILTER (WHERE metric_code = 'FCF_YIELD_PERCENT') FROM obs) > 0
      THEN 'CANONICAL_ONLY_NO_ALIAS_OBSERVATION_MIGRATION_NEEDED'
    ELSE 'REVIEW_REQUIRED'
  END AS preflight_state,
  'WRITE_AUTHORIZED=NO' AS write_authorization;

ROLLBACK;
\echo ''
\echo '=== G6.5 PREFLIGHT COMPLETE: READ ONLY / 0 WRITES ==='
