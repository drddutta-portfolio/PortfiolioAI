\set ON_ERROR_STOP on
\pset pager off

BEGIN;

\echo ''
\echo '=== R4N TORNTPHARM LOCAL OBSERVATION MUTATION ==='
\echo 'Scope: up to 4 PHARMA_EXPORT_US_REVENUE_GROWTH fundamental observations.'
\echo ''

DO $preflight$
DECLARE
  v_security_count integer;
  v_assignment_count integer;
  v_metric_count integer;
  v_source_count integer;
  v_conflict_count integer;
BEGIN
  SELECT count(*)
  INTO v_security_count
  FROM public.securities
  WHERE symbol = 'TORNTPHARM'
    AND exchange = 'NSE'
    AND is_active;

  IF v_security_count <> 1 THEN
    RAISE EXCEPTION 'TORNTPHARM_SECURITY_IDENTITY_NOT_UNIQUE';
  END IF;

  SELECT count(*)
  INTO v_assignment_count
  FROM public.research_subprofile_assignments a
  JOIN public.securities s ON s.id = a.security_id
  WHERE s.symbol = 'TORNTPHARM'
    AND s.exchange = 'NSE'
    AND s.is_active
    AND a.parent_profile_code = 'PHARMA'
    AND a.parent_profile_version = 'PHARMA_V1'
    AND a.subprofile_code = 'DOMESTIC_FORMULATIONS'
    AND a.assignment_status = 'REVIEWED'
    AND a.effective_from <= clock_timestamp()
    AND (a.effective_to IS NULL OR clock_timestamp() < a.effective_to);

  IF v_assignment_count <> 1 THEN
    RAISE EXCEPTION 'REVIEWED_DOMESTIC_FORMULATIONS_ASSIGNMENT_NOT_UNIQUE';
  END IF;

  SELECT count(*)
  INTO v_metric_count
  FROM public.fundamental_metric_definitions
  WHERE code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
    AND value_kind = 'NUMERIC'
    AND canonical_unit = 'PERCENT'
    AND statement_scope = 'PHARMA_BUSINESS_MODEL'
    AND is_active;

  IF v_metric_count <> 1 THEN
    RAISE EXCEPTION 'PHARMA_EXPORT_US_REVENUE_GROWTH_CONTRACT_MISSING_OR_MISMATCHED';
  END IF;

  WITH expected(external_record_id) AS (
    VALUES
      ('TORRENT_Q1_FY26_RELEASE'),
      ('TORRENT_Q2_FY26_RELEASE'),
      ('TORRENT_Q3_FY26_RELEASE'),
      ('TORRENT_Q4_FY26_RELEASE')
  )
  SELECT count(*)
  INTO v_source_count
  FROM expected e
  JOIN public.data_source_records d
    ON d.source_code = 'COMPANY_EXCHANGE_FILING'
   AND d.record_kind = 'ISSUER_RESULTS_RELEASE'
   AND d.external_record_id = e.external_record_id;

  IF v_source_count <> 4 THEN
    RAISE EXCEPTION 'IMMUTABLE_SOURCE_RECORDS_INCOMPLETE';
  END IF;

  WITH expected(period_end, numeric_value) AS (
    VALUES
      (DATE '2025-06-30', 19::numeric),
      (DATE '2025-09-30', 26::numeric),
      (DATE '2025-12-31', 19::numeric),
      (DATE '2026-03-31', 16::numeric)
  ),
  target_security AS (
    SELECT id
    FROM public.securities
    WHERE symbol = 'TORNTPHARM'
      AND exchange = 'NSE'
      AND is_active
  )
  SELECT count(*)
  INTO v_conflict_count
  FROM expected e
  CROSS JOIN target_security s
  JOIN public.fundamental_observations f
    ON f.security_id = s.id
   AND f.metric_code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
   AND f.period_end = e.period_end
   AND f.period_type = 'QUARTER'
   AND f.consolidation_scope = 'UNKNOWN'
  WHERE f.numeric_value IS DISTINCT FROM e.numeric_value
     OR f.unit IS DISTINCT FROM 'PERCENT';

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'CONFLICTING_EXISTING_US_GROWTH_FACT';
  END IF;
END
$preflight$;

WITH expected(period_end, numeric_value, external_record_id) AS (
  VALUES
    (DATE '2025-06-30', 19::numeric, 'TORRENT_Q1_FY26_RELEASE'),
    (DATE '2025-09-30', 26::numeric, 'TORRENT_Q2_FY26_RELEASE'),
    (DATE '2025-12-31', 19::numeric, 'TORRENT_Q3_FY26_RELEASE'),
    (DATE '2026-03-31', 16::numeric, 'TORRENT_Q4_FY26_RELEASE')
),
target_security AS (
  SELECT id
  FROM public.securities
  WHERE symbol = 'TORNTPHARM'
    AND exchange = 'NSE'
    AND is_active
),
metric_contract AS (
  SELECT freshness_seconds
  FROM public.fundamental_metric_definitions
  WHERE code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
    AND value_kind = 'NUMERIC'
    AND canonical_unit = 'PERCENT'
    AND statement_scope = 'PHARMA_BUSINESS_MODEL'
    AND is_active
),
resolved AS (
  SELECT
    s.id AS security_id,
    e.period_end,
    e.numeric_value,
    d.id AS source_record_id,
    d.source_code,
    d.retrieved_at,
    m.freshness_seconds
  FROM expected e
  CROSS JOIN target_security s
  CROSS JOIN metric_contract m
  JOIN public.data_source_records d
    ON d.source_code = 'COMPANY_EXCHANGE_FILING'
   AND d.record_kind = 'ISSUER_RESULTS_RELEASE'
   AND d.external_record_id = e.external_record_id
)
INSERT INTO public.fundamental_observations (
  security_id,
  metric_code,
  source_record_id,
  source_code,
  numeric_value,
  unit,
  period_end,
  period_type,
  consolidation_scope,
  retrieved_at,
  fresh_until,
  evidence_status
)
SELECT
  r.security_id,
  'PHARMA_EXPORT_US_REVENUE_GROWTH',
  r.source_record_id,
  r.source_code,
  r.numeric_value,
  'PERCENT',
  r.period_end,
  'QUARTER',
  'UNKNOWN',
  r.retrieved_at,
  r.retrieved_at + make_interval(secs => r.freshness_seconds),
  'AVAILABLE'
FROM resolved r
WHERE NOT EXISTS (
  SELECT 1
  FROM public.fundamental_observations f
  WHERE f.security_id = r.security_id
    AND f.metric_code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
    AND f.period_end = r.period_end
    AND f.period_type = 'QUARTER'
    AND f.consolidation_scope = 'UNKNOWN'
    AND f.numeric_value = r.numeric_value
    AND f.unit = 'PERCENT'
);

DO $verify$
DECLARE
  v_exact_count integer;
  v_conflict_count integer;
BEGIN
  WITH expected(period_end, numeric_value) AS (
    VALUES
      (DATE '2025-06-30', 19::numeric),
      (DATE '2025-09-30', 26::numeric),
      (DATE '2025-12-31', 19::numeric),
      (DATE '2026-03-31', 16::numeric)
  ),
  target_security AS (
    SELECT id
    FROM public.securities
    WHERE symbol = 'TORNTPHARM'
      AND exchange = 'NSE'
      AND is_active
  )
  SELECT count(*)
  INTO v_exact_count
  FROM expected e
  CROSS JOIN target_security s
  JOIN public.fundamental_observations f
    ON f.security_id = s.id
   AND f.metric_code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
   AND f.period_end = e.period_end
   AND f.period_type = 'QUARTER'
   AND f.consolidation_scope = 'UNKNOWN'
   AND f.numeric_value = e.numeric_value
   AND f.unit = 'PERCENT';

  IF v_exact_count <> 4 THEN
    RAISE EXCEPTION 'POSTCONDITION_EXACT_OBSERVATION_COUNT_NOT_FOUR';
  END IF;

  WITH expected(period_end, numeric_value) AS (
    VALUES
      (DATE '2025-06-30', 19::numeric),
      (DATE '2025-09-30', 26::numeric),
      (DATE '2025-12-31', 19::numeric),
      (DATE '2026-03-31', 16::numeric)
  ),
  target_security AS (
    SELECT id
    FROM public.securities
    WHERE symbol = 'TORNTPHARM'
      AND exchange = 'NSE'
      AND is_active
  )
  SELECT count(*)
  INTO v_conflict_count
  FROM expected e
  CROSS JOIN target_security s
  JOIN public.fundamental_observations f
    ON f.security_id = s.id
   AND f.metric_code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
   AND f.period_end = e.period_end
   AND f.period_type = 'QUARTER'
   AND f.consolidation_scope = 'UNKNOWN'
  WHERE f.numeric_value IS DISTINCT FROM e.numeric_value
     OR f.unit IS DISTINCT FROM 'PERCENT';

  IF v_conflict_count <> 0 THEN
    RAISE EXCEPTION 'POSTCONDITION_CONFLICT_COUNT_NOT_ZERO';
  END IF;
END
$verify$;

\echo 'Preconditions: PASS'
\echo 'Postconditions: PASS'
\echo 'Exact reviewed observation count: 4'
\echo 'Conflicting observation count: 0'

COMMIT;

\echo ''
\echo '=== LOCAL OBSERVATION MUTATION COMPLETE ==='
\echo 'Persistent local fundamental-observation rows: up to 4 (idempotent)'
\echo 'Production writes: 0'
