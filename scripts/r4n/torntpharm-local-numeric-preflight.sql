\set ON_ERROR_STOP on
\pset pager off

BEGIN TRANSACTION READ ONLY;

\echo ''
\echo '=== R4N TORNTPHARM LOCAL NUMERIC PREFLIGHT ==='
\echo 'READ ONLY: no rows will be inserted, updated, or deleted.'
\echo ''

\echo '--- Canonical identity / contract prerequisites ---'
WITH
security_rows AS (
  SELECT id, symbol, exchange, name
  FROM public.securities
  WHERE symbol = 'TORNTPHARM'
    AND exchange = 'NSE'
    AND is_active
),
assignment_rows AS (
  SELECT a.*
  FROM public.research_subprofile_assignments a
  JOIN security_rows s ON s.id = a.security_id
  WHERE a.parent_profile_code = 'PHARMA'
    AND a.parent_profile_version = 'PHARMA_V1'
    AND a.subprofile_code = 'DOMESTIC_FORMULATIONS'
    AND a.assignment_status = 'REVIEWED'
    AND a.effective_from <= clock_timestamp()
    AND (a.effective_to IS NULL OR clock_timestamp() < a.effective_to)
),
metric_rows AS (
  SELECT *
  FROM public.fundamental_metric_definitions
  WHERE code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
)
SELECT
  (SELECT count(*) FROM security_rows) AS torntpharm_security_rows,
  (SELECT count(*) FROM assignment_rows) AS active_reviewed_domestic_formulations_assignments,
  (SELECT count(*) FROM metric_rows) AS metric_definition_rows,
  COALESCE((
    SELECT value_kind = 'NUMERIC'
       AND canonical_unit = 'PERCENT'
       AND statement_scope = 'PHARMA_BUSINESS_MODEL'
       AND is_active
    FROM metric_rows
    LIMIT 1
  ), false) AS metric_definition_matches_expected_contract;

\echo ''
\echo '--- Four reviewed US-growth rows ---'
WITH
expected(period_end, expected_value, artifact_code, source_url) AS (
  VALUES
    (DATE '2025-06-30', 19::numeric, 'TORRENT_Q1_FY26_RELEASE', 'https://www.torrentpharma.com/assets/Torrent_Pharma_Press_Release_Q1_FY_26_Results_a857463993.pdf'),
    (DATE '2025-09-30', 26::numeric, 'TORRENT_Q2_FY26_RELEASE', 'https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q2_25_26_90203574c9.pdf'),
    (DATE '2025-12-31', 19::numeric, 'TORRENT_Q3_FY26_RELEASE', 'https://www.torrentpharma.com/docs/Press_release_Q3_25_26_V6_9c697bb7fe.pdf'),
    (DATE '2026-03-31', 16::numeric, 'TORRENT_Q4_FY26_RELEASE', 'https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf')
),
security_rows AS (
  SELECT id
  FROM public.securities
  WHERE symbol = 'TORNTPHARM'
    AND exchange = 'NSE'
    AND is_active
),
security_state AS (
  SELECT count(*) AS security_count, (array_agg(id ORDER BY id::text))[1] AS security_id
  FROM security_rows
),
assignment_state AS (
  SELECT count(*) AS assignment_count
  FROM public.research_subprofile_assignments a
  JOIN security_state s ON a.security_id = s.security_id
  WHERE s.security_count = 1
    AND a.parent_profile_code = 'PHARMA'
    AND a.parent_profile_version = 'PHARMA_V1'
    AND a.subprofile_code = 'DOMESTIC_FORMULATIONS'
    AND a.assignment_status = 'REVIEWED'
    AND a.effective_from <= clock_timestamp()
    AND (a.effective_to IS NULL OR clock_timestamp() < a.effective_to)
),
metric_state AS (
  SELECT
    count(*) AS metric_count,
    COALESCE(bool_and(
      value_kind = 'NUMERIC'
      AND canonical_unit = 'PERCENT'
      AND statement_scope = 'PHARMA_BUSINESS_MODEL'
      AND is_active
    ), false) AS metric_matches
  FROM public.fundamental_metric_definitions
  WHERE code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
),
resolved AS (
  SELECT
    e.*,
    sr.id AS source_record_id,
    sr.retrieved_at AS source_retrieved_at,
    COALESCE(obs.exact_count, 0) AS exact_existing_count,
    COALESCE(obs.conflict_count, 0) AS conflicting_existing_count,
    ss.security_count,
    ast.assignment_count,
    ms.metric_count,
    ms.metric_matches
  FROM expected e
  CROSS JOIN security_state ss
  CROSS JOIN assignment_state ast
  CROSS JOIN metric_state ms
  LEFT JOIN LATERAL (
    SELECT d.id, d.retrieved_at
    FROM public.data_source_records d
    WHERE d.source_code = 'COMPANY_EXCHANGE_FILING'
      AND (
        d.source_url = e.source_url
        OR d.external_record_id = e.artifact_code
        OR d.raw_payload ->> 'sourceArtifactCode' = e.artifact_code
        OR d.raw_payload ->> 'artifactCode' = e.artifact_code
      )
    ORDER BY
      (d.source_url = e.source_url) DESC,
      d.retrieved_at DESC,
      d.created_at DESC
    LIMIT 1
  ) sr ON true
  LEFT JOIN LATERAL (
    SELECT
      count(*) FILTER (
        WHERE f.numeric_value = e.expected_value
          AND f.unit = 'PERCENT'
      ) AS exact_count,
      count(*) FILTER (
        WHERE f.numeric_value IS DISTINCT FROM e.expected_value
           OR f.unit IS DISTINCT FROM 'PERCENT'
      ) AS conflict_count
    FROM public.fundamental_observations f
    WHERE f.security_id = ss.security_id
      AND f.metric_code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
      AND f.period_type = 'QUARTER'
      AND f.period_end = e.period_end
  ) obs ON ss.security_count = 1
)
SELECT
  period_end,
  expected_value,
  artifact_code,
  CASE WHEN source_record_id IS NULL THEN 'MISSING' ELSE source_record_id::text END AS source_record,
  exact_existing_count,
  conflicting_existing_count,
  CASE
    WHEN security_count <> 1 THEN 'BLOCKED'
    WHEN assignment_count <> 1 THEN 'BLOCKED'
    WHEN metric_count <> 1 OR NOT metric_matches THEN 'BLOCKED'
    WHEN source_record_id IS NULL THEN 'BLOCKED'
    WHEN conflicting_existing_count > 0 THEN 'CONFLICT'
    WHEN exact_existing_count > 0 THEN 'ALREADY_PRESENT'
    ELSE 'INSERT_CANDIDATE'
  END AS disposition,
  concat_ws(',',
    CASE WHEN security_count <> 1 THEN 'SECURITY_IDENTITY_NOT_UNIQUE' END,
    CASE WHEN assignment_count <> 1 THEN 'REVIEWED_ASSIGNMENT_NOT_UNIQUE' END,
    CASE WHEN metric_count <> 1 OR NOT metric_matches THEN 'METRIC_DEFINITION_MISSING_OR_MISMATCHED' END,
    CASE WHEN source_record_id IS NULL THEN 'SOURCE_RECORD_MISSING' END,
    CASE WHEN conflicting_existing_count > 0 THEN 'CONFLICTING_EXISTING_FACT' END
  ) AS blockers
FROM resolved
ORDER BY period_end;

\echo ''
\echo '--- Preflight summary ---'
WITH
expected(period_end, expected_value, artifact_code, source_url) AS (
  VALUES
    (DATE '2025-06-30', 19::numeric, 'TORRENT_Q1_FY26_RELEASE', 'https://www.torrentpharma.com/assets/Torrent_Pharma_Press_Release_Q1_FY_26_Results_a857463993.pdf'),
    (DATE '2025-09-30', 26::numeric, 'TORRENT_Q2_FY26_RELEASE', 'https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q2_25_26_90203574c9.pdf'),
    (DATE '2025-12-31', 19::numeric, 'TORRENT_Q3_FY26_RELEASE', 'https://www.torrentpharma.com/docs/Press_release_Q3_25_26_V6_9c697bb7fe.pdf'),
    (DATE '2026-03-31', 16::numeric, 'TORRENT_Q4_FY26_RELEASE', 'https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf')
),
s AS (
  SELECT count(*) AS security_count, (array_agg(id ORDER BY id::text))[1] AS security_id
  FROM public.securities
  WHERE symbol = 'TORNTPHARM' AND exchange = 'NSE' AND is_active
),
a AS (
  SELECT count(*) AS assignment_count
  FROM public.research_subprofile_assignments x
  JOIN s ON x.security_id = s.security_id
  WHERE s.security_count = 1
    AND x.parent_profile_code = 'PHARMA'
    AND x.parent_profile_version = 'PHARMA_V1'
    AND x.subprofile_code = 'DOMESTIC_FORMULATIONS'
    AND x.assignment_status = 'REVIEWED'
    AND x.effective_from <= clock_timestamp()
    AND (x.effective_to IS NULL OR clock_timestamp() < x.effective_to)
),
m AS (
  SELECT
    count(*) AS metric_count,
    COALESCE(bool_and(
      value_kind = 'NUMERIC'
      AND canonical_unit = 'PERCENT'
      AND statement_scope = 'PHARMA_BUSINESS_MODEL'
      AND is_active
    ), false) AS metric_matches
  FROM public.fundamental_metric_definitions
  WHERE code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
),
row_state AS (
  SELECT
    e.period_end,
    CASE
      WHEN s.security_count <> 1 THEN 'BLOCKED'
      WHEN a.assignment_count <> 1 THEN 'BLOCKED'
      WHEN m.metric_count <> 1 OR NOT m.metric_matches THEN 'BLOCKED'
      WHEN sr.id IS NULL THEN 'BLOCKED'
      WHEN COALESCE(obs.conflict_count, 0) > 0 THEN 'CONFLICT'
      WHEN COALESCE(obs.exact_count, 0) > 0 THEN 'ALREADY_PRESENT'
      ELSE 'INSERT_CANDIDATE'
    END AS disposition
  FROM expected e
  CROSS JOIN s
  CROSS JOIN a
  CROSS JOIN m
  LEFT JOIN LATERAL (
    SELECT d.id
    FROM public.data_source_records d
    WHERE d.source_code = 'COMPANY_EXCHANGE_FILING'
      AND (
        d.source_url = e.source_url
        OR d.external_record_id = e.artifact_code
        OR d.raw_payload ->> 'sourceArtifactCode' = e.artifact_code
        OR d.raw_payload ->> 'artifactCode' = e.artifact_code
      )
    ORDER BY (d.source_url = e.source_url) DESC, d.retrieved_at DESC, d.created_at DESC
    LIMIT 1
  ) sr ON true
  LEFT JOIN LATERAL (
    SELECT
      count(*) FILTER (WHERE f.numeric_value = e.expected_value AND f.unit = 'PERCENT') AS exact_count,
      count(*) FILTER (WHERE f.numeric_value IS DISTINCT FROM e.expected_value OR f.unit IS DISTINCT FROM 'PERCENT') AS conflict_count
    FROM public.fundamental_observations f
    WHERE f.security_id = s.security_id
      AND f.metric_code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
      AND f.period_type = 'QUARTER'
      AND f.period_end = e.period_end
  ) obs ON s.security_count = 1
)
SELECT
  count(*) AS rows_checked,
  count(*) FILTER (WHERE disposition = 'INSERT_CANDIDATE') AS insert_candidates,
  count(*) FILTER (WHERE disposition = 'ALREADY_PRESENT') AS already_present,
  count(*) FILTER (WHERE disposition = 'CONFLICT') AS conflicts,
  count(*) FILTER (WHERE disposition = 'BLOCKED') AS blocked,
  CASE
    WHEN count(*) FILTER (WHERE disposition IN ('CONFLICT', 'BLOCKED')) = 0
      THEN 'READY_FOR_SEPARATE_WRITE_APPROVAL'
    ELSE 'NOT_READY'
  END AS preflight_state,
  'WRITE_AUTHORIZED=NO' AS write_authorization
FROM row_state;

ROLLBACK;

\echo ''
\echo '=== PREFLIGHT COMPLETE: READ ONLY / 0 WRITES ==='
