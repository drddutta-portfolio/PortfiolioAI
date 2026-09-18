\set ON_ERROR_STOP on
\pset pager off

BEGIN;

\echo ''
\echo '=== R4N TORNTPHARM LOCAL PREREQUISITE MUTATION ==='
\echo 'Scope: 1 metric definition + 4 immutable source records only.'
\echo ''

DO $preflight$
DECLARE
  v_source_count integer;
  v_metric_conflicts integer;
  v_source_conflicts integer;
BEGIN
  SELECT count(*)
  INTO v_source_count
  FROM public.data_sources
  WHERE code = 'COMPANY_EXCHANGE_FILING'
    AND is_active
    AND entitlement_verified
    AND retention_rights_verified;

  IF v_source_count <> 1 THEN
    RAISE EXCEPTION 'PREREQUISITE_SOURCE_REGISTRY_NOT_APPROVED';
  END IF;

  SELECT count(*)
  INTO v_metric_conflicts
  FROM public.fundamental_metric_definitions
  WHERE code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
    AND NOT (
      name = 'Export / US Revenue Growth'
      AND value_kind = 'NUMERIC'
      AND canonical_unit = 'PERCENT'
      AND statement_scope = 'PHARMA_BUSINESS_MODEL'
      AND freshness_seconds = 10368000
      AND definition = '{"provider":"COMPANY_EXCHANGE_FILING","selection":"REVIEWED","periodType":"QUARTER","semanticGuard":"SEPARATELY_DISCLOSED_US_OR_EXPORT_REVENUE_GROWTH_ONLY","mappingVersion":"PHARMA_V1_GLOBAL_GENERICS_V1","sourcePriority":["COMPANY_EXCHANGE_FILING"],"rejectedSubstitutes":["TOTAL_INTERNATIONAL_REVENUE_GROWTH_WITHOUT_COMPATIBLE_SCOPE"]}'::jsonb
      AND is_active
    );

  IF v_metric_conflicts > 0 THEN
    RAISE EXCEPTION 'METRIC_DEFINITION_CONFLICT';
  END IF;

  WITH expected(external_record_id, source_url, payload_hash, raw_payload) AS (
    VALUES
      (
        'TORRENT_Q1_FY26_RELEASE',
        'https://www.torrentpharma.com/assets/Torrent_Pharma_Press_Release_Q1_FY_26_Results_a857463993.pdf',
        'b8a8b87c01a1ea1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f',
        '{"artifactCode":"TORRENT_Q1_FY26_RELEASE","artifactPeriod":"Q1 FY2025-26","artifactTitle":"Torrent Pharma Q1 FY26 Results Release","basis":"US business revenue YoY growth — reported Torrent business","contractVersion":"TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1","metricCode":"PHARMA_EXPORT_US_REVENUE_GROWTH","observationDate":"2025-06-30","provenanceSummary":"Issuer Q1 FY26 release states US business revenues of Rs 308 crore, up 19% YoY.","reviewState":"READ_ONLY_REVIEWED","reviewedValue":"19","unit":"PERCENT"}'::jsonb
      ),
      (
        'TORRENT_Q2_FY26_RELEASE',
        'https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q2_25_26_90203574c9.pdf',
        '3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fceec5f2',
        '{"artifactCode":"TORRENT_Q2_FY26_RELEASE","artifactPeriod":"Q2 FY2025-26","artifactTitle":"Torrent Pharma Q2 FY26 Results Release","basis":"US business revenue YoY growth — reported Torrent business","contractVersion":"TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1","metricCode":"PHARMA_EXPORT_US_REVENUE_GROWTH","observationDate":"2025-09-30","provenanceSummary":"Issuer Q2 FY26 release states US business revenues of Rs 337 crore, up 26% YoY.","reviewState":"READ_ONLY_REVIEWED","reviewedValue":"26","unit":"PERCENT"}'::jsonb
      ),
      (
        'TORRENT_Q3_FY26_RELEASE',
        'https://www.torrentpharma.com/docs/Press_release_Q3_25_26_V6_9c697bb7fe.pdf',
        '3df20aaafb6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7',
        '{"artifactCode":"TORRENT_Q3_FY26_RELEASE","artifactPeriod":"Q3 FY2025-26","artifactTitle":"Torrent Pharma Q3 FY26 Results Release","basis":"US business revenue YoY growth — reported Torrent business","contractVersion":"TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1","metricCode":"PHARMA_EXPORT_US_REVENUE_GROWTH","observationDate":"2025-12-31","provenanceSummary":"Issuer Q3 FY26 release states US business revenues of Rs 321 crore, up 19% YoY.","reviewState":"READ_ONLY_REVIEWED","reviewedValue":"19","unit":"PERCENT"}'::jsonb
      ),
      (
        'TORRENT_Q4_FY26_RELEASE',
        'https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf',
        'd08cf8f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e990922998b53',
        '{"artifactCode":"TORRENT_Q4_FY26_RELEASE","artifactPeriod":"Q4 FY2025-26","artifactTitle":"Torrent Pharma Q4 FY26 Results Release","basis":"US base-business revenue YoY growth — excludes JB acquisition effect","contractVersion":"TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1","metricCode":"PHARMA_EXPORT_US_REVENUE_GROWTH","observationDate":"2026-03-31","provenanceSummary":"Issuer Q4 FY26 release separately states US base-business revenue grew 16% YoY; this is used instead of the 31% reported figure to preserve pre-acquisition scope compatibility.","reviewState":"READ_ONLY_REVIEWED","reviewedValue":"16","unit":"PERCENT"}'::jsonb
      )
  )
  SELECT count(*)
  INTO v_source_conflicts
  FROM public.data_source_records d
  JOIN expected e
    ON d.source_code = 'COMPANY_EXCHANGE_FILING'
   AND d.record_kind = 'ISSUER_RESULTS_RELEASE'
   AND d.external_record_id = e.external_record_id
  WHERE d.payload_hash <> e.payload_hash
     OR d.raw_payload <> e.raw_payload
     OR d.source_url IS DISTINCT FROM e.source_url;

  IF v_source_conflicts > 0 THEN
    RAISE EXCEPTION 'SOURCE_RECORD_CONFLICT';
  END IF;
END
$preflight$;

INSERT INTO public.fundamental_metric_definitions (
  code,
  name,
  value_kind,
  canonical_unit,
  statement_scope,
  freshness_seconds,
  definition,
  is_active
)
VALUES (
  'PHARMA_EXPORT_US_REVENUE_GROWTH',
  'Export / US Revenue Growth',
  'NUMERIC',
  'PERCENT',
  'PHARMA_BUSINESS_MODEL',
  10368000,
  '{"provider":"COMPANY_EXCHANGE_FILING","selection":"REVIEWED","periodType":"QUARTER","semanticGuard":"SEPARATELY_DISCLOSED_US_OR_EXPORT_REVENUE_GROWTH_ONLY","mappingVersion":"PHARMA_V1_GLOBAL_GENERICS_V1","sourcePriority":["COMPANY_EXCHANGE_FILING"],"rejectedSubstitutes":["TOTAL_INTERNATIONAL_REVENUE_GROWTH_WITHOUT_COMPATIBLE_SCOPE"]}'::jsonb,
  true
)
ON CONFLICT (code) DO NOTHING;

WITH expected(source_code, record_kind, external_record_id, source_url, payload_hash, raw_payload, terms_snapshot) AS (
  VALUES
    (
      'COMPANY_EXCHANGE_FILING',
      'ISSUER_RESULTS_RELEASE',
      'TORRENT_Q1_FY26_RELEASE',
      'https://www.torrentpharma.com/assets/Torrent_Pharma_Press_Release_Q1_FY_26_Results_a857463993.pdf',
      'b8a8b87c01a1ea1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f',
      '{"artifactCode":"TORRENT_Q1_FY26_RELEASE","artifactPeriod":"Q1 FY2025-26","artifactTitle":"Torrent Pharma Q1 FY26 Results Release","basis":"US business revenue YoY growth — reported Torrent business","contractVersion":"TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1","metricCode":"PHARMA_EXPORT_US_REVENUE_GROWTH","observationDate":"2025-06-30","provenanceSummary":"Issuer Q1 FY26 release states US business revenues of Rs 308 crore, up 19% YoY.","reviewState":"READ_ONLY_REVIEWED","reviewedValue":"19","unit":"PERCENT"}'::jsonb,
      '{"sourceClass":"PUBLIC_PRIMARY_ISSUER","retentionScope":"METADATA_AND_EXTRACTED_PUBLIC_FACTS_ONLY","reviewedContentOnly":true}'::jsonb
    ),
    (
      'COMPANY_EXCHANGE_FILING',
      'ISSUER_RESULTS_RELEASE',
      'TORRENT_Q2_FY26_RELEASE',
      'https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q2_25_26_90203574c9.pdf',
      '3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fceec5f2',
      '{"artifactCode":"TORRENT_Q2_FY26_RELEASE","artifactPeriod":"Q2 FY2025-26","artifactTitle":"Torrent Pharma Q2 FY26 Results Release","basis":"US business revenue YoY growth — reported Torrent business","contractVersion":"TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1","metricCode":"PHARMA_EXPORT_US_REVENUE_GROWTH","observationDate":"2025-09-30","provenanceSummary":"Issuer Q2 FY26 release states US business revenues of Rs 337 crore, up 26% YoY.","reviewState":"READ_ONLY_REVIEWED","reviewedValue":"26","unit":"PERCENT"}'::jsonb,
      '{"sourceClass":"PUBLIC_PRIMARY_ISSUER","retentionScope":"METADATA_AND_EXTRACTED_PUBLIC_FACTS_ONLY","reviewedContentOnly":true}'::jsonb
    ),
    (
      'COMPANY_EXCHANGE_FILING',
      'ISSUER_RESULTS_RELEASE',
      'TORRENT_Q3_FY26_RELEASE',
      'https://www.torrentpharma.com/docs/Press_release_Q3_25_26_V6_9c697bb7fe.pdf',
      '3df20aaafb6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7',
      '{"artifactCode":"TORRENT_Q3_FY26_RELEASE","artifactPeriod":"Q3 FY2025-26","artifactTitle":"Torrent Pharma Q3 FY26 Results Release","basis":"US business revenue YoY growth — reported Torrent business","contractVersion":"TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1","metricCode":"PHARMA_EXPORT_US_REVENUE_GROWTH","observationDate":"2025-12-31","provenanceSummary":"Issuer Q3 FY26 release states US business revenues of Rs 321 crore, up 19% YoY.","reviewState":"READ_ONLY_REVIEWED","reviewedValue":"19","unit":"PERCENT"}'::jsonb,
      '{"sourceClass":"PUBLIC_PRIMARY_ISSUER","retentionScope":"METADATA_AND_EXTRACTED_PUBLIC_FACTS_ONLY","reviewedContentOnly":true}'::jsonb
    ),
    (
      'COMPANY_EXCHANGE_FILING',
      'ISSUER_RESULTS_RELEASE',
      'TORRENT_Q4_FY26_RELEASE',
      'https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf',
      'd08cf8f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e990922998b53',
      '{"artifactCode":"TORRENT_Q4_FY26_RELEASE","artifactPeriod":"Q4 FY2025-26","artifactTitle":"Torrent Pharma Q4 FY26 Results Release","basis":"US base-business revenue YoY growth — excludes JB acquisition effect","contractVersion":"TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1","metricCode":"PHARMA_EXPORT_US_REVENUE_GROWTH","observationDate":"2026-03-31","provenanceSummary":"Issuer Q4 FY26 release separately states US base-business revenue grew 16% YoY; this is used instead of the 31% reported figure to preserve pre-acquisition scope compatibility.","reviewState":"READ_ONLY_REVIEWED","reviewedValue":"16","unit":"PERCENT"}'::jsonb,
      '{"sourceClass":"PUBLIC_PRIMARY_ISSUER","retentionScope":"METADATA_AND_EXTRACTED_PUBLIC_FACTS_ONLY","reviewedContentOnly":true}'::jsonb
    )
)
INSERT INTO public.data_source_records (
  source_code,
  record_kind,
  external_record_id,
  source_url,
  payload_hash,
  raw_payload,
  terms_snapshot
)
SELECT
  e.source_code,
  e.record_kind,
  e.external_record_id,
  e.source_url,
  e.payload_hash,
  e.raw_payload,
  e.terms_snapshot
FROM expected e
WHERE NOT EXISTS (
  SELECT 1
  FROM public.data_source_records d
  WHERE d.source_code = e.source_code
    AND d.record_kind = e.record_kind
    AND d.external_record_id = e.external_record_id
    AND d.payload_hash = e.payload_hash
);

DO $verify$
DECLARE
  v_metric_count integer;
  v_source_count integer;
BEGIN
  SELECT count(*)
  INTO v_metric_count
  FROM public.fundamental_metric_definitions
  WHERE code = 'PHARMA_EXPORT_US_REVENUE_GROWTH'
    AND value_kind = 'NUMERIC'
    AND canonical_unit = 'PERCENT'
    AND statement_scope = 'PHARMA_BUSINESS_MODEL'
    AND is_active;

  IF v_metric_count <> 1 THEN
    RAISE EXCEPTION 'POSTCONDITION_METRIC_DEFINITION_NOT_EXACTLY_ONE';
  END IF;

  SELECT count(*)
  INTO v_source_count
  FROM public.data_source_records
  WHERE source_code = 'COMPANY_EXCHANGE_FILING'
    AND record_kind = 'ISSUER_RESULTS_RELEASE'
    AND (
      (external_record_id = 'TORRENT_Q1_FY26_RELEASE' AND payload_hash = 'b8a8b87c01a1ea1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f')
      OR (external_record_id = 'TORRENT_Q2_FY26_RELEASE' AND payload_hash = '3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fceec5f2')
      OR (external_record_id = 'TORRENT_Q3_FY26_RELEASE' AND payload_hash = '3df20aaafb6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7')
      OR (external_record_id = 'TORRENT_Q4_FY26_RELEASE' AND payload_hash = 'd08cf8f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e990922998b53')
    );

  IF v_source_count <> 4 THEN
    RAISE EXCEPTION 'POSTCONDITION_SOURCE_RECORD_COUNT_NOT_FOUR';
  END IF;
END
$verify$;

\echo 'Preconditions: PASS'
\echo 'Postconditions: PASS'
\echo 'Metric definition target count: 1'
\echo 'Source record target count: 4'
\echo 'Fundamental observations inserted: 0'

COMMIT;

\echo ''
\echo '=== LOCAL PREREQUISITE MUTATION COMPLETE ==='
\echo 'Persistent local writes: 5 prerequisite rows maximum (idempotent)'
\echo 'Fundamental observation writes: 0'
